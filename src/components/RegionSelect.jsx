import MultiSelect from "./MultiSelect";

export default function RegionSelect({ regions, selected, onChange }) {
  return <MultiSelect options={regions} selected={selected} onChange={onChange} />;
}
