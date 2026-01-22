/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        primaryLight: "#3B82F6",
        appBg: "#F8FAFC",
        cardBg: "#FFFFFF",
        sectionBg: "#F1F5F9",
        textPrimary: "#0F172A",
        textSecondary: "#475569",
        textMuted: "#94A3B8",
        success: "#10B981",
        successLight: "#34D399",
        warning: "#F59E0B",
        danger: "#EF4444",
        borderLight: "#CBD5E1",
      },
    },
  },
  plugins: [],
}
