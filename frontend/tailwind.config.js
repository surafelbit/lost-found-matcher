/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-background": "#181c1e",
        "on-error-container": "#93000a",
        "on-primary-container": "#86a0cd",
        "surface-bright": "#f7fafc",
        "error": "#ba1a1a",
        "surface-container-lowest": "#ffffff",
        "tertiary-fixed-dim": "#9fcaff",
        "on-primary-fixed-variant": "#2d476f",
        "on-tertiary-fixed": "#001d37",
        "secondary-container": "#ffc250",
        "on-tertiary-container": "#58a2f0",
        "on-surface-variant": "#43474e",
        "surface-container": "#ebeef0",
        "on-primary": "#ffffff",
        "on-tertiary": "#ffffff",
        "inverse-surface": "#2d3133",
        "on-secondary-fixed-variant": "#5f4100",
        "tertiary": "#00213e",
        "surface-variant": "#e0e3e5",
        "surface-container-highest": "#e0e3e5",
        "primary": "#002045",
        "surface-tint": "#455f88",
        "on-error": "#ffffff",
        "on-tertiary-fixed-variant": "#00497e",
        "on-primary-fixed": "#001b3c",
        "on-secondary-fixed": "#271900",
        "outline": "#74777f",
        "inverse-primary": "#adc7f7",
        "tertiary-fixed": "#d2e4ff",
        "secondary-fixed": "#ffdeaa",
        "primary-fixed-dim": "#adc7f7",
        "secondary-fixed-dim": "#f8bc4b",
        "primary-container": "#1a365d",
        "error-container": "#ffdad6",
        "surface-container-low": "#f1f4f6",
        "secondary": "#7d5700",
        "surface-dim": "#d7dadc",
        "tertiary-container": "#003762",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#725000",
        "outline-variant": "#c4c6cf",
        "inverse-on-surface": "#eef1f3",
        "background": "#f7fafc",
        "primary-fixed": "#d6e3ff",
        "on-surface": "#181c1e",
        "surface": "#f7fafc",
        "surface-container-high": "#e5e9eb"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "base": "4px",
        "lg": "32px",
        "md": "24px",
        "xl": "48px",
        "gutter": "24px",
        "margin-mobile": "16px",
        "xs": "8px",
        "sm": "16px"
      },
      maxWidth: {
        "container-max": "1120px"
      },
      fontFamily: {
        "headline-lg-mobile": ["Inter"],
        "body-lg": ["Inter"],
        "headline-lg": ["Inter"],
        "label-sm": ["Inter"],
        "label-md": ["Inter"],
        "body-md": ["Inter"],
        "display-lg": ["Inter"],
        "headline-md": ["Inter"]
      },
      fontSize: {
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }]
      }
    }
  }
}
