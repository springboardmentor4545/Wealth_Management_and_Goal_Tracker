// src/services/simulationApi.js

export async function createSimulation(payload) {
  const res = await fetch("http://127.0.0.1:8000/simulations/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create simulation");
  }

  return res.json();
}
