import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Home from "./components/Home";
import { isAuthenticated } from "./api/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      {isLoggedIn ? (
        <Home onLogout={handleLogout} />
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;

