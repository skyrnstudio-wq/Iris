import React from "react";

interface IrisLogoProps {
  size?: number | string;
  variant?: "badge" | "mark" | "full";
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}

export function IrisLogo({
  size = 32,
  variant = "badge",
  className = "",
  showSubtitle = false,
  subtitle = "Chief of Staff",
}: IrisLogoProps) {
  const pixelSize = typeof size === "number" ? size : undefined;
  const style = pixelSize ? { width: pixelSize, height: pixelSize } : undefined;

  // The core vector SVG of the IRIS Aperture
  const renderSvg = (withBadge: boolean) => (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={withBadge ? "w-full h-full" : "w-full h-full drop-shadow-sm"}
      aria-label="IRIS Logo"
      role="img"
    >
      <defs>
        {/* Background gradient for app icon badge */}
        <linearGradient id="iris_bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1c1917" />
          <stop offset="50%" stopColor="#0f0f12" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>

        {/* Squircle border subtle chamfer */}
        <linearGradient id="iris_border_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#27272a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#18181b" stopOpacity="0.85" />
        </linearGradient>

        {/* Emerald Core & Star of Intent */}
        <linearGradient id="iris_em_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <radialGradient id="iris_halo_grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        {/* Precision aperture blade silver & platinum gradients */}
        <linearGradient id="iris_blade_0" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="iris_blade_1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="iris_blade_2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        <filter id="iris_glow_filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {withBadge && (
        <>
          {/* iOS Squircle Frame */}
          <rect width="512" height="512" rx="116" fill="url(#iris_bg_grad)" />
          <rect
            width="506"
            height="506"
            x="3"
            y="3"
            rx="113"
            fill="none"
            stroke="url(#iris_border_grad)"
            strokeWidth="2.5"
          />

          {/* Ambient Emerald Halo */}
          <circle cx="256" cy="256" r="215" fill="url(#iris_halo_grad)" />

          {/* Precision Outer Dial Calibration & Routine Track */}
          <circle
            cx="256"
            cy="256"
            r="226"
            fill="none"
            stroke="#27272a"
            strokeWidth="1.5"
            strokeDasharray="3 9"
          />
        </>
      )}

      {/* 6-Blade Aperture Shutter Assembly */}
      <g transform="translate(256, 256)">
        {/* Housing Rim */}
        <circle cx="0" cy="0" r="201" fill="#0b0b0d" stroke="#27272a" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="197" fill="none" stroke="#18181b" strokeWidth="1.5" />

        {/* Blade 1 */}
        <path
          d="M 62.00,184.97 L 62.00,0.00 A 62 62 0 0 1 31.00,53.69 L -129.28,146.00 A 195 195 0 0 0 62.00,184.97 Z"
          fill="url(#iris_blade_0)"
          stroke="#09090b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="62.00" y1="184.97" x2="62.00" y2="0.00" stroke="#10b981" strokeWidth="2" opacity="0.9" />

        {/* Blade 2 */}
        <path
          d="M -129.28,146.00 L 31.00,53.69 A 62 62 0 0 1 -31.00,53.69 L -191.28,-38.97 A 195 195 0 0 0 -129.28,146.00 Z"
          fill="url(#iris_blade_1)"
          stroke="#09090b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="-129.28" y1="146.00" x2="31.00" y2="53.69" stroke="#10b981" strokeWidth="2" opacity="0.9" />

        {/* Blade 3 */}
        <path
          d="M -191.28,-38.97 L -31.00,53.69 A 62 62 0 0 1 -62.00,0.00 L -62.00,-184.97 A 195 195 0 0 0 -191.28,-38.97 Z"
          fill="url(#iris_blade_2)"
          stroke="#09090b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="-191.28" y1="-38.97" x2="-31.00" y2="53.69" stroke="#10b981" strokeWidth="2" opacity="0.9" />

        {/* Blade 4 */}
        <path
          d="M -62.00,-184.97 L -62.00,0.00 A 62 62 0 0 1 -31.00,-53.69 L 129.28,-146.00 A 195 195 0 0 0 -62.00,-184.97 Z"
          fill="url(#iris_blade_0)"
          stroke="#09090b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="-62.00" y1="-184.97" x2="-62.00" y2="0.00" stroke="#10b981" strokeWidth="2" opacity="0.9" />

        {/* Blade 5 */}
        <path
          d="M 129.28,-146.00 L -31.00,-53.69 A 62 62 0 0 1 31.00,-53.69 L 191.28,38.97 A 195 195 0 0 0 129.28,-146.00 Z"
          fill="url(#iris_blade_1)"
          stroke="#09090b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="129.28" y1="-146.00" x2="-31.00" y2="-53.69" stroke="#10b981" strokeWidth="2" opacity="0.9" />

        {/* Blade 6 */}
        <path
          d="M 191.28,38.97 L 31.00,-53.69 A 62 62 0 0 1 62.00,0.00 L 62.00,184.97 A 195 195 0 0 0 191.28,38.97 Z"
          fill="url(#iris_blade_2)"
          stroke="#09090b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <line x1="191.28" y1="38.97" x2="31.00" y2="-53.69" stroke="#10b981" strokeWidth="2" opacity="0.9" />

        {/* Central Iris Lens Bezel */}
        <circle cx="0" cy="0" r="62" fill="#09090b" stroke="#18181b" strokeWidth="2" />

        {/* Luminous Emerald Iris Pupil */}
        <circle cx="0" cy="0" r="52" fill="url(#iris_em_grad)" filter="url(#iris_glow_filter)" />
        <circle cx="0" cy="0" r="52" fill="none" stroke="#a7f3d0" strokeWidth="2" opacity="0.85" />

        {/* Inner Pupil Core */}
        <circle cx="0" cy="0" r="24" fill="#064e3b" opacity="0.95" />

        {/* Radiant 4-Point Star of Intent */}
        <path
          d="M 0,-30 Q 0,0 30,0 Q 0,0 0,30 Q 0,0 -30,0 Q 0,0 0,-30 Z"
          fill="#ffffff"
          opacity="0.98"
        />
        <circle cx="0" cy="0" r="7" fill="#a7f3d0" />
      </g>
    </svg>
  );

  if (variant === "full") {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <div style={style} className="shrink-0 aspect-square">
          {renderSvg(true)}
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-wider text-stone-900 font-sans">
            IRIS
          </span>
          {showSubtitle && (
            <span className="text-[10px] font-medium tracking-wide text-stone-400 uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`inline-block aspect-square shrink-0 select-none ${className}`}
    >
      {renderSvg(variant === "badge")}
    </div>
  );
}
