import { STATUS_COLORS } from "../utils/palette";
import { useLanguage } from "../i18n/LanguageContext";

export default function StatusDot({ status }) {
  const { t } = useLanguage();
  if (!status) return null;
  const color = STATUS_COLORS[status];
  if (!color) return null;

  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-neutral-800"
      style={{ background: color }}
      title={t(`myCard.status.${status}`)}
    />
  );
}
