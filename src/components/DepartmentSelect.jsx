import MultiSelect from "./MultiSelect";
import { useLanguage } from "../i18n/LanguageContext";

export default function DepartmentSelect({ departments, selected, onChange }) {
  const { t } = useLanguage();

  const options = departments.map((dept) => ({ value: dept.code, label: dept.label }));

  return (
    <MultiSelect
      label={t("sidebar.departmentsTitle")}
      placeholder={t("sidebar.allDepartments")}
      options={options}
      selected={selected}
      onChange={onChange}
      searchable
    />
  );
}
