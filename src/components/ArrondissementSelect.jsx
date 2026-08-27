import MultiSelect from "./MultiSelect";
import { PARIS_ARRONDISSEMENT_OPTIONS } from "../utils/arrondissement";

export default function ArrondissementSelect({ selected, onChange }) {
  return <MultiSelect options={PARIS_ARRONDISSEMENT_OPTIONS} selected={selected} onChange={onChange} />;
}
