import { useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import ViewModeToggle from "./components/ViewModeToggle";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import MapLegend from "./components/MapLegend";
import LocateMeButton from "./components/LocateMeButton";
import HeatmapToggle from "./components/HeatmapToggle";
import RoutePlanner from "./components/RoutePlanner";
import MobileTabs from "./components/MobileTabs";
import Dashboard from "./components/Dashboard";
import StoreDetailPanel from "./components/StoreDetailPanel";
import SettingsPanel from "./components/SettingsPanel";
import ImportSummaryModal from "./components/ImportSummaryModal";
import WhiteZonesToggle from "./components/WhiteZonesToggle";
import ChatWidget from "./components/ChatWidget";
import CarnetView from "./components/CarnetView";
import LoginScreen from "./components/LoginScreen";
import AdminPanel from "./components/AdminPanel";
import CommandPalette from "./components/CommandPalette";
import AddStoreModal from "./components/AddStoreModal";
import TodayAgendaWidget from "./components/TodayAgendaWidget";
import OnboardingTour from "./components/OnboardingTour";
import { getAppointmentTimes, setAppointmentTime, clearAppointmentTime } from "./utils/appointmentTimes";
import { hasSeenOnboarding, markOnboardingSeen } from "./utils/onboarding";
import { parseVCard } from "./utils/vcardImport";
import { applySampleFilter } from "./utils/sampleMode";
import Toast from "./components/Toast";
import { getStoreRegion } from "./utils/regions";
import { getStoreDepartment } from "./utils/departments";
import { getStoreType } from "./utils/storeType";
import { haversineDistanceKm } from "./utils/geo";
import { exportStoresToXlsx } from "./utils/xlsxExport";
import { parseSpreadsheetFile } from "./utils/fileParsing";
import { detectColumns, matchPortfolioRows } from "./utils/portfolioMatching";
import { computeWhiteZones } from "./utils/whiteZones";
import {
  STORE_STATUSES,
  getFavorites,
  toggleFavorite,
  getPortfolio,
  addToPortfolio,
  resetPortfolio,
  restorePortfolio,
  getNotes,
  setNote,
  getStatuses,
  setStatus,
  getTags,
  setTags,
  getPriorities,
  setPriority,
  getVisitDates,
  setVisitDate,
} from "./utils/myCard";
import {
  getAllVisitNotes,
  addVisitNote,
  getProspectFirstSeen,
  recordProspectContact,
} from "./utils/activity";
import {
  getGpsRealtimeEnabled,
  setGpsRealtimeEnabled,
  getPreferredGpsApp,
  setPreferredGpsApp,
  getDefaultAddress,
  setDefaultAddress,
} from "./utils/gpsPrefs";
import { getCurrentUser, signOut as authSignOut, isAdmin as checkIsAdmin } from "./services/authService";
import { mergeWithOverrides } from "./services/storesService";
import { useLanguage } from "./i18n/LanguageContext";
import { useTheme } from "./theme/ThemeContext";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");
const NEAR_ME_LIMIT = 30;
// Same rationale as CarnetView's UNDO_TOAST_DURATION_MS: an undo toast stays
// up longer than a plain confirmation so there's a real window to react.
const UNDO_TOAST_DURATION_MS = 7000;

function normalize(text) {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

function App() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [baseStores, setBaseStores] = useState([]);
  const [storesOverrideVersion, setStoresOverrideVersion] = useState(0);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [addStoreModalOpen, setAddStoreModalOpen] = useState(false);
  const [addStoreInitialValues, setAddStoreInitialValues] = useState(undefined);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // "Version Beta" hidden sample/demo mode — on by default (the app opens
  // restricted to the department-75/Vuarnet-Maui Jim-Julbo sample), and
  // deliberately not persisted to localStorage so a session that switched
  // to the full network never silently carries that over to the next one.
  // Toggled from the discreet trigger on the login screen (LoginScreen),
  // before `currentUser` is set.
  const [sampleMode, setSampleMode] = useState(true);
  const [pendingCarnetFolderId, setPendingCarnetFolderId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState("map");
  const [search, setSearch] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedStoreTypes, setSelectedStoreTypes] = useState([]);
  const [browseAll, setBrowseAll] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [routeStops, setRouteStops] = useState([]);
  const [routeOrder, setRouteOrder] = useState(null);
  const [viewMode, setViewMode] = useState("global");
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites());
  const [portfolioIds, setPortfolioIds] = useState(() => getPortfolio());
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [notes, setNotes] = useState(() => getNotes());
  const [statuses, setStatuses] = useState(() => getStatuses());
  const [tags, setTagsState] = useState(() => getTags());
  const [priorities, setPrioritiesState] = useState(() => getPriorities());
  const [visitDates, setVisitDatesState] = useState(() => getVisitDates());
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [whiteZonesActive, setWhiteZonesActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [visitNotes, setVisitNotesState] = useState(() => getAllVisitNotes());
  const [appointmentTimes, setAppointmentTimesState] = useState(() => getAppointmentTimes());
  const [prospectFirstSeen, setProspectFirstSeen] = useState(() => getProspectFirstSeen());
  const [gpsRealtimeEnabled, setGpsRealtimeEnabledState] = useState(() => getGpsRealtimeEnabled());
  const [preferredGpsApp, setPreferredGpsAppState] = useState(() => getPreferredGpsApp());
  const [defaultAddress, setDefaultAddressState] = useState(() => getDefaultAddress());

  useEffect(() => {
    fetch("/stores.json")
      .then((res) => res.json())
      .then((data) => setBaseStores(data));
  }, []);

  // First-run guided tour: opens once per device, right after there's a
  // signed-in user, unless it's already been seen (or replayed manually
  // from Paramètres > Aide & FAQ, which opens it without touching this
  // flag). Runs on every mount with an active session, not just a fresh
  // login, so a rep who reloads mid-tour still sees it resume from the top.
  useEffect(() => {
    if (currentUser && !hasSeenOnboarding()) {
      setOnboardingOpen(true);
    }
  }, [currentUser]);

  // Global "go to" shortcut for the Cmd+K search palette — Ctrl+K on
  // Windows/Linux, Cmd+K on macOS. Toggling (rather than only opening)
  // lets the same shortcut close it back if pressed again.
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Layers any admin-imported opticians (Administration panel) on top of
  // the static dataset — see services/storesService.js for why this is a
  // per-device merge, not a real shared database update.
  const mergedStores = useMemo(
    () => mergeWithOverrides(baseStores),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseStores, storesOverrideVersion],
  );

  // "Version Beta" sample mode narrows the entire app down to this single
  // derivation — every filter, map view, and Mon Carnet list downstream
  // just keeps consuming `stores` as usual, so none of that code needs to
  // change to respect the restriction.
  const stores = useMemo(
    () => (sampleMode ? applySampleFilter(mergedStores) : mergedStores),
    [mergedStores, sampleMode],
  );

  const myCardStores = useMemo(
    () => stores.filter((s) => portfolioIds.includes(s.id) || favoriteIds.includes(s.id)),
    [stores, portfolioIds, favoriteIds],
  );

  // "Zones blanches" (prospecting opportunities) are always computed from
  // the whole, unfiltered network — narrowing this to whatever's currently
  // filtered would defeat the point of a "where am I completely absent"
  // analysis.
  const whiteZones = useMemo(() => computeWhiteZones(stores), [stores]);

  // Every option list (brands, regions, departments, cities) and the search
  // universe itself narrow to "Ma Carte" when that view is active, so the
  // sidebar never offers a filter value that isn't actually in the personal
  // set.
  const baseUniverse = viewMode === "mycard" ? myCardStores : stores;

  const allBrands = useMemo(() => {
    const set = new Set();
    baseUniverse.forEach((store) => store.brands.forEach((brand) => set.add(brand)));
    return [...set].sort();
  }, [baseUniverse]);

  const allRegions = useMemo(() => {
    const set = new Set();
    baseUniverse.forEach((store) => {
      const region = getStoreRegion(store);
      if (region) set.add(region);
    });
    return [...set].sort();
  }, [baseUniverse]);

  // Cascading geo filters: department options narrow to the selected
  // region(s), and city options narrow to the selected region(s) AND
  // department(s) — independent of the other filters (search, brands, type).
  const availableDepartments = useMemo(() => {
    const map = new Map();
    baseUniverse.forEach((store) => {
      if (selectedRegions.length > 0 && !selectedRegions.includes(getStoreRegion(store))) {
        return;
      }
      const dept = getStoreDepartment(store);
      if (dept) map.set(dept.code, dept);
    });
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [baseUniverse, selectedRegions]);

  const availableCities = useMemo(() => {
    const set = new Set();
    baseUniverse.forEach((store) => {
      if (selectedRegions.length > 0 && !selectedRegions.includes(getStoreRegion(store))) {
        return;
      }
      if (
        selectedDepartments.length > 0 &&
        !selectedDepartments.includes(getStoreDepartment(store)?.code)
      ) {
        return;
      }
      set.add(store.city);
    });
    return [...set].sort();
  }, [baseUniverse, selectedRegions, selectedDepartments]);

  // Prune selections that fall outside the now-narrower option list, so a
  // region/department change can never leave a "dead" selection behind that
  // silently forces zero results.
  useEffect(() => {
    const allowedCodes = new Set(availableDepartments.map((d) => d.code));
    setSelectedDepartments((prev) => {
      const next = prev.filter((code) => allowedCodes.has(code));
      return next.length === prev.length ? prev : next;
    });
  }, [availableDepartments]);

  useEffect(() => {
    const allowedCities = new Set(availableCities);
    setSelectedCities((prev) => {
      const next = prev.filter((city) => allowedCities.has(city));
      return next.length === prev.length ? prev : next;
    });
  }, [availableCities]);

  const hasActiveFilter =
    search.trim() !== "" ||
    selectedCities.length > 0 ||
    selectedRegions.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedBrands.length > 0 ||
    selectedStoreTypes.length > 0;

  const filteredStores = useMemo(() => {
    let base;
    if (hasActiveFilter) {
      const query = normalize(search.trim());
      base = baseUniverse.filter((store) => {
        const haystack = normalize(
          `${store.name} ${store.address} ${store.city} ${store.country}`,
        );
        const matchesSearch = query === "" || haystack.includes(query);
        const matchesCity =
          selectedCities.length === 0 || selectedCities.includes(store.city);
        const matchesRegion =
          selectedRegions.length === 0 ||
          selectedRegions.includes(getStoreRegion(store));
        const matchesDepartment =
          selectedDepartments.length === 0 ||
          selectedDepartments.includes(getStoreDepartment(store)?.code);
        const matchesBrands =
          selectedBrands.length === 0 ||
          store.brands.some((brand) => selectedBrands.includes(brand));
        const matchesType =
          selectedStoreTypes.length === 0 ||
          selectedStoreTypes.includes(getStoreType(store));
        return (
          matchesSearch &&
          matchesCity &&
          matchesRegion &&
          matchesDepartment &&
          matchesBrands &&
          matchesType
        );
      });
    } else if (browseAll || userLocation || viewMode === "mycard") {
      base = baseUniverse;
    } else {
      base = [];
    }

    if (viewMode === "mycard" && selectedStatuses.length > 0) {
      base = base.filter((store) => selectedStatuses.includes(statuses[store.id]));
    }

    if (userLocation) {
      const withDistance = base
        .map((store) => ({
          ...store,
          distanceKm: haversineDistanceKm(
            userLocation.lat,
            userLocation.lng,
            store.lat,
            store.lng,
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      if (!hasActiveFilter && !browseAll && viewMode !== "mycard") {
        return withDistance.slice(0, NEAR_ME_LIMIT);
      }
      return withDistance;
    }

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    baseUniverse,
    search,
    selectedCities,
    selectedRegions,
    selectedDepartments,
    selectedBrands,
    selectedStoreTypes,
    hasActiveFilter,
    browseAll,
    userLocation,
    viewMode,
    statuses,
    selectedStatuses,
  ]);

  // The "Ma Carte" favorites badge must never show a stale, unfiltered
  // total: it reflects only the favorites currently visible under sample
  // mode and whatever sidebar filters (region/city/brand/status…) are
  // active, recomputed from the same `filteredStores` the map/list already
  // render — never the raw favoriteIds.length across the whole network.
  const visibleFavoritesCount = useMemo(
    () => filteredStores.filter((s) => favoriteIds.includes(s.id)).length,
    [filteredStores, favoriteIds],
  );

  const selectedStoreBase = stores.find((s) => s.id === selectedStoreId);
  const selectedStore =
    selectedStoreBase && userLocation
      ? {
          ...selectedStoreBase,
          distanceKm: haversineDistanceKm(
            userLocation.lat,
            userLocation.lng,
            selectedStoreBase.lat,
            selectedStoreBase.lng,
          ),
        }
      : selectedStoreBase;
  const showResults =
    hasActiveFilter || browseAll || Boolean(userLocation) || viewMode === "mycard";
  const myCardIsEmpty =
    viewMode === "mycard" && portfolioIds.length === 0 && favoriteIds.length === 0;
  // Statistics reflect whatever the user is currently looking at (search,
  // geo/brand/type filters, "Ma Carte"); with nothing active, fall back to
  // the whole network rather than an empty dashboard.
  const statsScope = showResults ? filteredStores : stores;

  // The routing origin actually used for "start from here": live GPS when
  // the rep has opted in (Settings > GPS & Géolocalisation), otherwise the
  // saved default start address — never blocked entirely, since a rep
  // without either simply gets directions with no fixed origin.
  const routeOrigin = gpsRealtimeEnabled
    ? userLocation
    : defaultAddress
      ? { lat: defaultAddress.lat, lng: defaultAddress.lng }
      : null;

  function handleSelectStore(id) {
    setSelectedStoreId(id);
    setDetailOpen(true);
    setMobileView("map");
  }

  function handleSignOut() {
    authSignOut();
    setCurrentUser(null);
  }

  function handleStoresOverrideUpdated() {
    setStoresOverrideVersion((v) => v + 1);
  }

  // AddStoreModal (Ma Carte) already geocoded and persisted the new store
  // as an override by the time this fires — this just drops it straight
  // into the rep's own portfolio, since a rep manually adding an optician
  // is doing so because they want to track it, not just add it to the
  // shared network.
  function handleStoreAdded(storeId) {
    setPortfolioIds(addToPortfolio([storeId]));
  }

  // "Importer une fiche contact (.vcf)" in Ma Carte: parses the vCard
  // client-side and opens the same AddStoreModal used for a from-scratch
  // manual add, pre-filled — a vCard never carries brands or a real geocode,
  // so the rep still reviews/completes the form before it's actually
  // submitted, rather than being silently added.
  function handleImportVCard(file) {
    const reader = new FileReader();
    reader.onload = () => {
      setAddStoreInitialValues(parseVCard(String(reader.result)));
      setAddStoreModalOpen(true);
    };
    reader.readAsText(file);
  }

  function handleCloseOnboarding() {
    markOnboardingSeen();
    setOnboardingOpen(false);
  }

  // Used when a store is opened from within Mon Carnet (e.g. an @mention
  // badge in the global Bloc-Notes) — leaves the Carnet workspace and drops
  // the user back on Carte Globale with that optician's detail panel open.
  function handleOpenStoreFromCarnet(id) {
    setViewMode("global");
    handleSelectStore(id);
  }

  // The command palette's quick-navigation actions — a small, fixed set of
  // destinations, so a plain switch is clearer than threading five more
  // one-off setter props through.
  function handleNavigateFromPalette(target) {
    if (target === "settings") {
      setShowSettings(true);
      return;
    }
    if (target === "stats") {
      setShowStats(true);
      return;
    }
    setViewMode(target);
  }

  // Jumping to a folder from the command palette needs Mon Carnet's own
  // selectedFolderId, which lives in CarnetView's local state — passed down
  // as a one-shot "pending" value that CarnetView applies and then clears,
  // rather than lifting the whole folder-selection state up to App.jsx.
  function handleOpenFolderFromPalette(folderId) {
    setViewMode("carnet");
    setPendingCarnetFolderId(folderId);
  }

  function toggleBrand(brand) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  }

  function toggleStoreType(type) {
    setSelectedStoreTypes((prev) =>
      prev.includes(type) ? prev.filter((t2) => t2 !== type) : [...prev, type],
    );
  }

  function toggleStatusFilter(status) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  function handleResetFilters() {
    setSearch("");
    setSelectedCities([]);
    setSelectedRegions([]);
    setSelectedDepartments([]);
    setSelectedBrands([]);
    setSelectedStoreTypes([]);
    setSelectedStatuses([]);
    setBrowseAll(false);
    setUserLocation(null);
    setGeoError(null);
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setGeoError(t("geo.unsupported"));
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError(t("geo.denied"));
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleSetGpsRealtimeEnabled(enabled) {
    setGpsRealtimeEnabled(enabled);
    setGpsRealtimeEnabledState(enabled);
  }

  function handleSetPreferredGpsApp(app) {
    setPreferredGpsApp(app);
    setPreferredGpsAppState(app);
  }

  function handleSetDefaultAddress(address) {
    setDefaultAddressState(setDefaultAddress(address));
  }

  function toggleRouteStop(store) {
    setRouteStops((prev) => {
      const exists = prev.some((s) => s.id === store.id);
      if (exists) return prev.filter((s) => s.id !== store.id);
      return [...prev, store];
    });
  }

  // Bulk, additive version of toggleRouteStop — used by Mon Carnet's
  // "Créer l'itinéraire" action on a folder/selection: always adds,
  // never removes, since toggling would be surprising when several of the
  // target stores might already be on the route.
  function addRouteStops(newStores) {
    setRouteStops((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const toAdd = newStores.filter((s) => !existingIds.has(s.id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }

  function handleToggleFavorite(storeId) {
    setFavoriteIds(toggleFavorite(storeId));
  }

  function handleSetNote(storeId, text) {
    setNotes(setNote(storeId, text));
  }

  function handleSetStatus(storeId, status) {
    setStatuses(setStatus(storeId, status));
    if (status === STORE_STATUSES.PROSPECT) {
      setProspectFirstSeen(recordProspectContact(storeId));
    }
  }

  function handleSetTags(storeId, tagList) {
    setTagsState(setTags(storeId, tagList));
  }

  function handleSetPriority(storeId, priority) {
    setPrioritiesState(setPriority(storeId, priority));
  }

  function handleSetVisitDate(storeId, date) {
    setVisitDatesState(setVisitDate(storeId, date));
  }

  function handleAddVisitNote(storeId, text, photoId) {
    setVisitNotesState(addVisitNote(storeId, text, photoId));
  }

  function handleRouteOptimized(result) {
    setRouteOrder(result?.order || null);
  }

  function handleSetAppointmentTime(storeId, start, end) {
    setAppointmentTimesState(setAppointmentTime(storeId, start, end));
  }

  function handleClearAppointmentTime(storeId) {
    setAppointmentTimesState(clearAppointmentTime(storeId));
  }

  function handleResetPortfolio() {
    const previousIds = portfolioIds;
    setPortfolioIds(resetPortfolio());

    window.clearTimeout(toastTimeoutRef.current);
    setToastMessage({
      text: t("myCard.resetToast"),
      actionLabel: t("myCard.undoReset"),
      onAction: () => {
        window.clearTimeout(toastTimeoutRef.current);
        setPortfolioIds(restorePortfolio(previousIds));
        setToastMessage(null);
      },
    });
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), UNDO_TOAST_DURATION_MS);
  }

  async function handleImportFile(file) {
    setImporting(true);
    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length < 2) {
        setImportResult({ matchedCount: 0, totalRows: 0, unmatched: [] });
        return;
      }
      const [headerRow, ...dataRows] = rows;
      const columnMap = detectColumns(headerRow);
      const { matched, unmatched } = matchPortfolioRows(dataRows, columnMap, stores);
      setPortfolioIds(addToPortfolio(matched.map((m) => m.store.id)));
      setImportResult({ matchedCount: matched.length, totalRows: dataRows.length, unmatched });
    } catch {
      setImportResult({ matchedCount: 0, totalRows: 0, unmatched: [], error: true });
    } finally {
      setImporting(false);
    }
  }

  function removeRouteStop(id) {
    setRouteStops((prev) => prev.filter((s) => s.id !== id));
  }

  function clearRoute() {
    setRouteStops([]);
    setRouteOrder(null);
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const labels = {
        sheetName: t("export.sheetName"),
        name: t("export.columns.name"),
        address: t("export.columns.address"),
        city: t("export.columns.city"),
        postalCode: t("export.columns.postalCode"),
        country: t("export.columns.country"),
        phone: t("export.columns.phone"),
        email: t("export.columns.email"),
        brands: t("export.columns.brands"),
        hours: t("export.columns.hours"),
        latitude: t("export.columns.latitude"),
        longitude: t("export.columns.longitude"),
      };
      await exportStoresToXlsx(
        filteredStores,
        labels,
        `opticiens-${filteredStores.length}.xlsx`,
      );
    } finally {
      setExporting(false);
    }
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onSignedIn={setCurrentUser}
        sampleMode={sampleMode}
        onToggleSampleMode={() => setSampleMode((v) => !v)}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      <Header
        currentUser={currentUser}
        isAdmin={checkIsAdmin(currentUser)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onSignOut={handleSignOut}
      />

      <ViewModeToggle
        mode={viewMode}
        onChange={setViewMode}
        currentUser={currentUser}
        isAdmin={checkIsAdmin(currentUser)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onSignOut={handleSignOut}
      />

      {viewMode !== "carnet" && (
        <MobileTabs
          view={mobileView}
          onChange={setMobileView}
          resultCount={filteredStores.length}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {viewMode === "carnet" ? (
          <CarnetView
            stores={myCardStores}
            allStores={stores}
            statuses={statuses}
            onSetStatus={handleSetStatus}
            priorities={priorities}
            onSetPriority={handleSetPriority}
            visitNotes={visitNotes}
            onAddVisitNote={handleAddVisitNote}
            prospectFirstSeen={prospectFirstSeen}
            favoriteIds={favoriteIds}
            routeStops={routeStops}
            routeOrder={routeOrder}
            onToggleRouteStop={toggleRouteStop}
            onAddRouteStops={addRouteStops}
            onRemoveRouteStop={removeRouteStop}
            onClearRoute={clearRoute}
            onOptimizeRoute={handleRouteOptimized}
            appointmentTimes={appointmentTimes}
            onSetAppointmentTime={handleSetAppointmentTime}
            onClearAppointmentTime={handleClearAppointmentTime}
            onOpenStore={handleOpenStoreFromCarnet}
            userLocation={routeOrigin}
            preferredGpsApp={preferredGpsApp}
            pendingFolderId={pendingCarnetFolderId}
            onConsumePendingFolder={() => setPendingCarnetFolderId(null)}
          />
        ) : (
          <>
            <div
              className={`${mobileView === "list" ? "flex" : "hidden"} h-full w-full md:flex md:w-auto`}
            >
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                viewMode={viewMode}
                portfolioCount={portfolioIds.length}
                favoritesCount={visibleFavoritesCount}
                importing={importing}
                onImportFile={handleImportFile}
                onResetPortfolio={handleResetPortfolio}
                onOpenAddStore={() => {
                  setAddStoreInitialValues(undefined);
                  setAddStoreModalOpen(true);
                }}
                onImportVCard={handleImportVCard}
                myCardEmptyMessage={myCardIsEmpty ? t("myCard.emptyPortfolio") : undefined}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                statuses={statuses}
                selectedStatuses={selectedStatuses}
                onToggleStatus={toggleStatusFilter}
                search={search}
                onSearchChange={setSearch}
                allStores={baseUniverse}
                cities={availableCities}
                selectedCities={selectedCities}
                onCitiesChange={setSelectedCities}
                regions={allRegions}
                selectedRegions={selectedRegions}
                onRegionsChange={setSelectedRegions}
                departments={availableDepartments}
                selectedDepartments={selectedDepartments}
                onDepartmentsChange={setSelectedDepartments}
                brands={allBrands}
                selectedBrands={selectedBrands}
                onToggleBrand={toggleBrand}
                selectedStoreTypes={selectedStoreTypes}
                onToggleStoreType={toggleStoreType}
                stores={filteredStores}
                hasActiveFilter={showResults}
                onResetFilters={handleResetFilters}
                onExport={handleExport}
                exporting={exporting}
                selectedStoreId={selectedStoreId}
                onSelectStore={handleSelectStore}
                routeStopIds={routeStops.map((s) => s.id)}
                onToggleRouteStop={toggleRouteStop}
              />
            </div>

            <div
              className={`${mobileView === "map" ? "block" : "hidden"} relative h-full w-full flex-1 bg-neutral-100 p-0 dark:bg-neutral-950 md:block md:p-3 lg:p-6`}
            >
              <div className="relative h-full w-full overflow-hidden border border-neutral-200 shadow-lg dark:border-neutral-800 md:rounded-2xl">
                <MapView
                  stores={filteredStores}
                  selectedStoreId={selectedStoreId}
                  selectedStore={selectedStore}
                  onSelectStore={handleSelectStore}
                  resizeTrigger={sidebarCollapsed}
                  userLocation={userLocation}
                  heatmapActive={heatmapActive}
                  isDark={isDark}
                  routeStops={routeStops}
                  routeOrder={routeOrder}
                  viewMode={viewMode}
                  statuses={statuses}
                  whiteZonesActive={whiteZonesActive}
                  whiteZones={whiteZones}
                />

                <div className="absolute right-4 top-4 z-[400] flex flex-col items-end gap-2">
                  {viewMode === "mycard" && (
                    <TodayAgendaWidget
                      routeStops={routeStops}
                      appointmentTimes={appointmentTimes}
                      preferredGpsApp={preferredGpsApp}
                      routeOrigin={routeOrigin}
                      onOpenStore={handleSelectStore}
                    />
                  )}
                  <HeatmapToggle
                    active={heatmapActive}
                    onToggle={() => setHeatmapActive((v) => !v)}
                  />
                  <WhiteZonesToggle
                    active={whiteZonesActive}
                    onToggle={() => setWhiteZonesActive((v) => !v)}
                  />
                  <LocateMeButton
                    onLocate={handleLocateMe}
                    active={Boolean(userLocation)}
                    loading={geoLoading}
                    error={geoError}
                  />
                </div>

                {showResults && filteredStores.length > 0 && !heatmapActive && (
                  <MapLegend viewMode={viewMode} />
                )}

                {!showResults && (
                  <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
                    <div className="pointer-events-auto max-w-sm rounded-xl border border-neutral-200 bg-white/95 px-6 py-5 text-center shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
                      <p className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
                        {t("map.emptyTitle")}
                      </p>
                      <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {t("map.emptyBody")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setBrowseAll(true)}
                        className="mt-4 cursor-pointer rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
                      >
                        {t("map.freeMode")}
                      </button>
                    </div>
                  </div>
                )}

                {viewMode === "mycard" && myCardIsEmpty && (
                  <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
                    <div className="pointer-events-auto max-w-sm rounded-xl border border-neutral-200 bg-white/95 px-6 py-5 text-center shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
                      <p className="font-serif text-lg text-neutral-900 dark:text-neutral-100">
                        {t("myCard.emptyPortfolioTitle")}
                      </p>
                      <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {t("myCard.emptyPortfolio")}
                      </p>
                    </div>
                  </div>
                )}

                <RoutePlanner
                  stops={routeStops}
                  onRemoveStop={removeRouteStop}
                  onClear={clearRoute}
                  liveLocation={userLocation}
                  onLocateMe={handleLocateMe}
                  geoLoading={geoLoading}
                  geoError={geoError}
                  gpsRealtimeEnabled={gpsRealtimeEnabled}
                  defaultAddress={defaultAddress}
                  portfolioStores={myCardStores}
                  onOptimize={handleRouteOptimized}
                  notes={notes}
                />

                <StoreDetailPanel
                  store={selectedStore}
                  open={detailOpen && Boolean(selectedStore)}
                  onClose={() => setDetailOpen(false)}
                  routeStopIds={routeStops.map((s) => s.id)}
                  onToggleRouteStop={toggleRouteStop}
                  isFavorite={selectedStore ? favoriteIds.includes(selectedStore.id) : false}
                  onToggleFavorite={handleToggleFavorite}
                  note={selectedStore ? notes[selectedStore.id] || "" : ""}
                  onSetNote={handleSetNote}
                  status={selectedStore ? statuses[selectedStore.id] || null : null}
                  onSetStatus={handleSetStatus}
                  priority={selectedStore ? priorities[selectedStore.id] || null : null}
                  onSetPriority={handleSetPriority}
                  tags={selectedStore ? tags[selectedStore.id] || [] : []}
                  onSetTags={handleSetTags}
                  visitDate={selectedStore ? visitDates[selectedStore.id] || null : null}
                  onSetVisitDate={handleSetVisitDate}
                  preferredGpsApp={preferredGpsApp}
                  routeOrigin={routeOrigin}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
          onSignOut={handleSignOut}
          gpsRealtimeEnabled={gpsRealtimeEnabled}
          onSetGpsRealtimeEnabled={handleSetGpsRealtimeEnabled}
          preferredGpsApp={preferredGpsApp}
          onSetPreferredGpsApp={handleSetPreferredGpsApp}
          defaultAddress={defaultAddress}
          onSetDefaultAddress={handleSetDefaultAddress}
          onReplayOnboarding={() => setOnboardingOpen(true)}
        />
      )}

      {showAdmin && checkIsAdmin(currentUser) && (
        <AdminPanel
          currentUser={currentUser}
          existingStores={stores}
          onStoresUpdated={handleStoresOverrideUpdated}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {showStats && (
        <Dashboard
          stores={statsScope}
          isFiltered={showResults}
          onClose={() => setShowStats(false)}
        />
      )}

      <ImportSummaryModal result={importResult} onClose={() => setImportResult(null)} />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        stores={stores}
        onOpenStore={handleOpenStoreFromCarnet}
        onOpenFolder={handleOpenFolderFromPalette}
        onNavigate={handleNavigateFromPalette}
      />

      <AddStoreModal
        open={addStoreModalOpen}
        onClose={() => setAddStoreModalOpen(false)}
        stores={stores}
        initialValues={addStoreInitialValues}
        onStoresUpdated={handleStoresOverrideUpdated}
        onAdded={handleStoreAdded}
      />

      <OnboardingTour open={onboardingOpen} onClose={handleCloseOnboarding} />

      <Toast
        message={toastMessage?.text}
        actionLabel={toastMessage?.actionLabel}
        onAction={toastMessage?.onAction}
      />

      <ChatWidget stores={stores} />
    </div>
  );
}

export default App;
