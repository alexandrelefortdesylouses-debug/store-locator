import { useLanguage } from "../i18n/LanguageContext";

export default function MapLegend() {
  const { t } = useLanguage();

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-xl border border-neutral-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#b45309]" />
        <span className="text-neutral-700">{t("map.legendFeatured")}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#57534e]" />
        <span className="text-neutral-700">{t("map.legendOther")}</span>
      </div>
    </div>
  );
}
