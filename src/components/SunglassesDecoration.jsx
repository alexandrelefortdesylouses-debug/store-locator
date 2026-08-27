import { useEffect, useState } from "react";

// Purely cosmetic corner motif for the login screen — a generic, unbranded
// pair of sunglasses. Two layers of motion: an ambient CSS float/rotate
// (.login-glasses-float, defined in index.css) plus a pointer-driven 3D
// tilt applied here as inline transform on a separate wrapper, so the two
// transforms compose instead of one overwriting the other. Both are skipped
// under prefers-reduced-motion.
export default function SunglassesDecoration({ className = "" }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function handlePointerMove(e) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      setTilt({ x: ny * -6, y: nx * 10 });
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ perspective: "800px" }}
    >
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.4s ease-out",
        }}
      >
        <div className="login-glasses-float">
          <svg viewBox="0 0 240 100" className="h-auto w-full" fill="none">
            <path d="M20 40 L2 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M220 40 L238 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M90 34 Q120 18 150 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <rect x="20" y="20" width="70" height="56" rx="18" stroke="currentColor" strokeWidth="4" />
            <rect x="150" y="20" width="70" height="56" rx="18" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
