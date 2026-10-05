import React from "react";

interface BanadirLogoProps {
  className?: string;
  variant?: "full" | "icon" | "horizontal";
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  theme?: "light" | "dark" | "auto";
}

export const BanadirLogo: React.FC<BanadirLogoProps> = ({
  className = "",
  variant = "full",
  size = "md",
  showSubtitle = true,
  theme = "light",
}) => {
  const isDark = theme === "dark";

  // Dimension scales
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const subSizes = {
    sm: "text-[8px] tracking-[0.22em]",
    md: "text-[10px] tracking-[0.28em]",
    lg: "text-xs tracking-[0.35em]",
    xl: "text-sm tracking-[0.4em]",
  };

  // Brand Palette from Logo
  const navyColor = isDark ? "#FFFFFF" : "#0B2559";
  const goldColor = "#F7B928";
  const greenColor = isDark ? "#22C55E" : "#0F9D58";
  const bagFill = isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF";

  // The Iconic Shopping Bag + Sunrise Vector
  const IconSvg = (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-xs"
    >
      {/* 3 Sun Rays (Golden Yellow #F7B928) */}
      <line
        x1="60"
        y1="7"
        x2="60"
        y2="19"
        stroke={goldColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="39"
        y1="16"
        x2="48"
        y2="23"
        stroke={goldColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="81"
        y1="16"
        x2="72"
        y2="23"
        stroke={goldColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Sun Dome inside Bag Handle */}
      <path
        d="M 52 35 A 8 8 0 0 1 68 35 Z"
        fill={goldColor}
      />

      {/* Shopping Bag Handle Arch */}
      <path
        d="M 47 48 L 47 34 C 47 22.5 73 22.5 73 34 L 73 48"
        stroke={navyColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Handle Base Circular Rivets */}
      <circle cx="47" cy="48" r="4.5" fill={navyColor} />
      <circle cx="73" cy="48" r="4.5" fill={navyColor} />

      {/* Shopping Bag Body */}
      <path
        d="M 33 38 L 87 38 L 80 84 C 79.5 87 77 89 74 89 L 46 89 C 43 89 40.5 87 40 84 Z"
        stroke={navyColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={bagFill}
      />
    </svg>
  );

  // Icon only
  if (variant === "icon") {
    return <div className={`inline-flex shrink-0 items-center justify-center ${iconSizes[size]} ${className}`}>{IconSvg}</div>;
  }

  // Horizontal logo (Icon on left, wordmark on right)
  if (variant === "horizontal") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <div className={`shrink-0 ${iconSizes[size]}`}>{IconSvg}</div>
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${textSizes[size]}`}>
            <span style={{ color: navyColor }}>bana</span>
            <span style={{ color: goldColor }}>dir</span>
          </div>
          {showSubtitle && (
            <div
              style={{ color: greenColor }}
              className={`font-extrabold uppercase mt-0.5 ${subSizes[size]}`}
            >
              — online —
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full stacked logo (Icon on top, wordmark below)
  return (
    <div className={`inline-flex flex-col items-center text-center ${className}`}>
      <div className={`${iconSizes[size]} mb-1`}>{IconSvg}</div>
      <div className={`font-black tracking-tight ${textSizes[size]} leading-none`}>
        <span style={{ color: navyColor }}>bana</span>
        <span style={{ color: goldColor }}>dir</span>
      </div>
      {showSubtitle && (
        <div
          style={{ color: greenColor }}
          className={`font-extrabold uppercase mt-1 ${subSizes[size]}`}
        >
          — online —
        </div>
      )}
    </div>
  );
};
export default BanadirLogo;
