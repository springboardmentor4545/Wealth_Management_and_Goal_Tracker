// src/pages/SimulationForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSimulation } from "../services/simulationApi";

function SimulationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    scenario_name: "",
    monthly_investment: "",
    years: "",
    expected_return: "",
    inflation_rate: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      scenario_name: form.scenario_name,
      goal_id: null,
      assumptions: {
        monthly_investment: Number(form.monthly_investment),
        years: Number(form.years),
        expected_return: Number(form.expected_return),
        inflation_rate: Number(form.inflation_rate),
      },
    };

    const result = await createSimulation(payload);
    navigate("/simulation/result", { state: result });
  };

  return (
    <div className="min-h-screen text-gray-900 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600">

      {/* ===== Top App Header ===== */}
      <header className="backdrop-blur-md bg-white/70 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Back Button */}
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium"
          >
            ← Back
          </button>

          <h1 className="text-xl font-bold text-orange-800">
            Investment Simulation
          </h1>

          {/* Profile Avatar */}
          <div
            className="w-10 h-10 rounded-full bg-gray-900 text-white
                       flex items-center justify-center font-semibold cursor-pointer"
            title="Profile"
            onClick={() => navigate("/profile")}
          >
            A
          </div>
        </div>
      </header>

      {/* ===== Page Content ===== */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">

          {/* Intro */}
          <div className="text-center mb-8">
            <p className="text-gray-600">
              Adjust assumptions to explore different financial outcomes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scenario Name
              </label>
              <input
                name="scenario_name"
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Investment (₹)
              </label>
              <input
                name="monthly_investment"
                type="number"
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Years)
                </label>
                <input
                  name="years"
                  type="number"
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Return (%)
                </label>
                <input
                  name="expected_return"
                  type="number"
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3
                             focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inflation Rate (%)
              </label>
              <input
                name="inflation_rate"
                type="number"
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-orange-400 to-pink-500
                         hover:from-orange-500 hover:to-pink-600
                         transition-all duration-200 shadow-lg"
            >
              Run Simulation
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SimulationForm;
