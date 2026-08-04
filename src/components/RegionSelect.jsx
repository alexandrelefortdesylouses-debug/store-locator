import MultiSelect from "./MultiSelect";
import { useLanguage } from "../i18n/LanguageContext";

export default function RegionSelect({ regions, selected, onChange }) {
  const { t } = useLanguage();

  return (
    <MultiSelect
      label={t("sidebar.regionsTitle")}
      placeholder={t("sidebar.allRegions")}
      options={regions}
      selected={selected}
      onChange={onChange}
    />
  );
}
