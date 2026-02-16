import Header from "./Header";
import { useTheme } from "../context/ThemeContext";

export default function MainLayout({ children }) {
  const { theme } = useTheme();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <Header />

      <div className="pt-24 min-h-screen transition-colors duration-300
        bg-blue-50 text-gray-800
        dark:bg-gray-900 dark:text-gray-100">
        {children}
      </div>
    </div>
  );
}
