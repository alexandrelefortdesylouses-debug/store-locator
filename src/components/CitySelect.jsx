import MultiSelect from "./MultiSelect";
import { useLanguage } from "../i18n/LanguageContext";
import { sortCitiesWithMajorFirst } from "../utils/frenchCities";

export default function CitySelect({ cities, selected, onChange }) {
  const { t } = useLanguage();
  const { major, others } = sortCitiesWithMajorFirst(cities);

  const groups = [
    ...(major.length > 0 ? [{ label: t("sidebar.majorCities"), options: major }] : []),
    ...(others.length > 0 ? [{ label: t("sidebar.otherCities"), options: others }] : []),
  ];

  return (
    <MultiSelect
      label={t("sidebar.citiesTitle")}
      placeholder={t("sidebar.allCities")}
      groups={groups}
      selected={selected}
      onChange={onChange}
      searchable
    />
  );
}
