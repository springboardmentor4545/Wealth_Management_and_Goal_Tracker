import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Simulations() {
  const [simulations, setSimulations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  const [form, setForm] = useState({
    scenario_name: "",
    monthly_investment: "",
    expected_return: "",
    inflation: "",
    years: "",
    goal_id: "",
  });

  // ---------------- FETCH ----------------
  const fetchSimulations = async () => {
    try {
      const res = await api.get("/simulations");
      setSimulations(res.data);
    } catch {
      toast.error("Failed to fetch simulations");
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch {
      toast.error("Failed to fetch goals");
    }
  };

  useEffect(() => {
    fetchSimulations();
    fetchGoals();
  }, []);

  // ---------------- FORM CHANGE ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        scenario_name: form.scenario_name,
        goal_id: form.goal_id ? Number(form.goal_id) : null,
        assumptions: {
          monthly_contribution: Number(form.monthly_investment),
          expected_return: Number(form.expected_return),
          inflation: Number(form.inflation),
          time_horizon_years: Number(form.years),
          initial_investment: 0,
        },
      };

      await api.post("/simulations", payload);

      toast.success("Simulation created successfully!");
      resetForm();
      fetchSimulations();
    } catch (error) {
      console.error(error.response?.data);
      toast.error("Failed to create simulation");
    }
  };

  const resetForm = () => {
    setForm({
      scenario_name: "",
      monthly_investment: "",
      expected_return: "",
      inflation: "",
      years: "",
      goal_id: "",
    });
    setShowForm(false);
  };

  // ---------------- VIEW ----------------
  const viewSimulation = async (id) => {
    try {
      const res = await api.get(`/simulations/${id}`);
      setSelectedSimulation(res.data);
    } catch {
      toast.error("Failed to fetch simulation details");
    }
  };

  // ---------------- COMPOUND GROWTH ----------------
  const generateGrowthData = (sim) => {
    const {
      monthly_contribution,
      expected_return,
      time_horizon_years,
      initial_investment,
    } = sim.assumptions;

    const data = [];
    const monthlyRate = expected_return / 100 / 12;

    let totalInvested = initial_investment;
    let futureValue = initial_investment;

    for (let year = 1; year <= time_horizon_years; year++) {
      for (let month = 1; month <= 12; month++) {
        futureValue =
          futureValue * (1 + monthlyRate) + monthly_contribution;
        totalInvested += monthly_contribution;
      }

      data.push({
        year,
        invested: Math.round(totalInvested),
        future: Math.round(futureValue),
      });
    }

    return data;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-10">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-blue-700">
            Your Simulations
          </h2>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg
                         hover:bg-blue-600 transition shadow"
            >
              + Run Simulation
            </button>
          )}
        </div>

        {/* ================= FORM ================= */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border border-blue-300 rounded-xl p-6 bg-blue-50"
          >
            <h3 className="text-xl font-semibold text-blue-800 mb-6">
              Run New Simulation
            </h3>

            {/* 2 COLUMN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block mb-2 font-medium">
                  Scenario Name
                </label>
                <input
                  name="scenario_name"
                  value={form.scenario_name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border border-blue-300"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Select Goal (Optional)
                </label>
                <select
                  name="goal_id"
                  value={form.goal_id}
                  onChange={handleChange}
                  className="w-full p-2 rounded border border-blue-300"
                >
                  <option value="">No Goal</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.goal_type} - ₹{g.target_amount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Monthly Investment (₹)
                </label>
                <input
                  type="number"
                  name="monthly_investment"
                  value={form.monthly_investment}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border border-blue-300"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  name="expected_return"
                  value={form.expected_return}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border border-blue-300"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Inflation Rate (%)
                </label>
                <input
                  type="number"
                  name="inflation"
                  value={form.inflation}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border border-blue-300"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Investment Duration (Years)
                </label>
                <input
                  type="number"
                  name="years"
                  value={form.years}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border border-blue-300"
                />
              </div>

            </div>

            <div className="flex gap-4 mt-8">
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition shadow">
                Save Simulation
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ================= TABLE ================= */}
        {!showForm && simulations.length > 0 && (
          <div className="rounded-xl shadow mt-6 overflow-x-auto border border-blue-200">
            <table className="w-full text-center">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-4">Scenario</th>
                  <th className="p-4">Total Invested</th>
                  <th className="p-4">Future Value</th>
                  <th className="p-4">Inflation Adjusted</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim) => (
                  <tr key={sim.id} className="border-t">
                    <td className="p-2">{sim.scenario_name}</td>
                    <td className="p-2">₹{sim.results.total_invested}</td>
                    <td className="p-2 text-green-600">
                      ₹{sim.results.future_value}
                    </td>
                    <td className="p-2 text-orange-600">
                      ₹{sim.results.inflation_adjusted_value}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => viewSimulation(sim.id)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= CHART ================= */}
        {selectedSimulation && (
          <div className="mt-10 border border-blue-300 rounded-xl p-6 bg-blue-50">
            <h3 className="text-xl font-semibold text-blue-800 mb-6">
              Investment Growth (Compound)
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateGrowthData(selectedSimulation)}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="invested" stroke="#2563eb" />
                <Line type="monotone" dataKey="future" stroke="#16a34a" />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedSimulation(null)}
                className="text-gray-600 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!showForm && simulations.length === 0 && (
          <div className="text-center text-blue-700 text-lg mt-10">
            No simulations yet. Run your first one.
          </div>
        )}
      </div>
    </div>
  );
}
