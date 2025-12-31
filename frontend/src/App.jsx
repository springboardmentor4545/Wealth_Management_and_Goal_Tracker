import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p class="text-lg text-gray-700">This is normal text</p>

      <p class="text-xl font-semibold text-green-600">Success message</p>

      <p class="text-sm text-red-500">Error message</p>
    </>
  );
}

export default App;
