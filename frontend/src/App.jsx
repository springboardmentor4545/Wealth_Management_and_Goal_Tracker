import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p className="text-lg text-gray-700">This is normal text</p>

      <p className="text-xl font-semibold text-green-600">
        Success message
      </p>

      <p className="text-sm text-red-500">Error message</p>
    </>
  );
}

export default App;

