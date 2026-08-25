// Minimal vCard (.vcf) reader — just enough to pre-fill AddStoreModal's
// form from a contact card shared by a colleague (name, phone, email,
// address), not a full RFC 6350 implementation. Deliberately doesn't
// handle line folding (a leading space/tab continuing the previous line)
// or multiple VCARDs in one file: real-world exports of a single contact
// from a phone's address book don't need either, and the form stays fully
// editable afterward for anything the parser missed or got wrong.
export function parseVCard(text) {
  const lines = String(text ?? "")
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const result = { name: "", phone: "", email: "", address: "", city: "", postal: "" };

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const rawKey = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1).trim();
    if (!value) continue;
    const key = rawKey.split(";")[0].toUpperCase();

    if (key === "FN" && !result.name) {
      result.name = value;
    } else if (key === "TEL" && !result.phone) {
      result.phone = value;
    } else if (key === "EMAIL" && !result.email) {
      result.email = value;
    } else if (key === "ADR" && !result.city) {
      // ADR components, semicolon-separated: PO Box; Extended Address;
      // Street; Locality (city); Region; Postal Code; Country.
      const parts = value.split(";");
      result.address = (parts[2] || "").trim();
      result.city = (parts[3] || "").trim();
      result.postal = (parts[5] || "").trim();
    }
  }

  return result;
}
