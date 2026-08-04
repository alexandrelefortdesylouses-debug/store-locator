import MultiSelect from "./MultiSelect";

export default function DepartmentSelect({ departments, selected, onChange }) {
  const options = departments.map((dept) => ({ value: dept.code, label: dept.label }));

  return <MultiSelect options={options} selected={selected} onChange={onChange} searchable />;
}
