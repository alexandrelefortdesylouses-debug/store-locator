export default function TheliosLogo({ className = "h-10 w-10" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Monogramme Thélios"
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1" />
      <circle
        cx="20"
        cy="20"
        r="13.5"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.5"
      />
      <text
        x="20"
        y="26.5"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="17"
        letterSpacing="0.5"
        fill="currentColor"
      >
        T
      </text>
    </svg>
  );
}
