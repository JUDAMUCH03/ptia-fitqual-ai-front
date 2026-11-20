import React from 'react';

export function FitQualLogo({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corner scanner brackets */}
      <path
        d="M5 12V8.5C5 6.567 6.567 5 8.5 5H12"
        stroke="#1e5128"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M28 5H31.5C33.433 5 35 6.567 35 8.5V12"
        stroke="#1e5128"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M5 28V31.5C5 33.433 6.567 35 8.5 35H12"
        stroke="#1e5128"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M28 35H31.5C33.433 35 35 33.433 35 31.5V28"
        stroke="#1e5128"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Leaf silhouette */}
      <path
        d="M27.5 12.5C20.5 12.5 14 16.5 13 24.5C13 24.5 14.5 27 17.5 27C24.5 27 28 21 27.5 12.5Z"
        fill="#4e9f3d"
        fillOpacity="0.18"
        stroke="#4e9f3d"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 27.5C15.5 24 19.5 20.5 24 17.5"
        stroke="#1e5128"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({ rightSlot = null, subtitle = null }) {
  return (
    <header
      className="flex items-center justify-between px-5 pt-3.5 pb-2"
      style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-2.5">
        <FitQualLogo size={32} />
        <div className="leading-tight">
          <div className="flex items-baseline gap-1 text-[18px] font-extrabold tracking-tight">
            <span className="text-forest">FitQual</span>
            <span className="text-mint">AI</span>
          </div>
          {subtitle && (
            <p className="text-[11px] font-medium text-muted">{subtitle}</p>
          )}
        </div>
      </div>

      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </header>
  );
}
