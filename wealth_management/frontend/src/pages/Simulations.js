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

  // ---------------- FORM ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    } catch {
      toast.error("Failed to create simulation");
    }
  };

  const viewSimulation = async (id) => {
    try {
      const res = await api.get(`/simulations/${id}`);
      setSelectedSimulation(res.data);
      setShowForm(false);
    } catch {
      toast.error("Failed to fetch simulation details");
    }
  };

  // ---------------- CHART DATA ----------------
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

  const inputClass =
    "w-full p-2 rounded border " +
    "bg-blue-50 dark:bg-gray-700 " +
    "border-blue-300 dark:border-gray-600 " +
    "text-gray-900 dark:text-white " +
    "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 " +
    "focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600";

  return (
    <div className="py-4 px-4">
      <div className="max-w-6xl mx-auto pt-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            Simulations
          </h2>

          {!showForm && (
            <button
              onClick={() => {
                setSelectedSimulation(null);
                setShowForm(true);
              }}
              className="px-6 py-2 rounded-lg shadow
                bg-blue-700 text-white hover:bg-blue-600 dark:bg-blue-400"
            >
              + Run Simulation
            </button>
          )}
        </div>

        {/* FORM */}
        {showForm && (
          <div className="flex justify-center mb-10">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-2xl rounded-2xl shadow-xl p-8
                bg-white dark:bg-gray-800"
            >
              <h3 className="text-2xl font-semibold text-center mb-6
                text-blue-700 dark:text-blue-300">
                Run Simulation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Scenario Name
                  </label>
                  <input
                    name="scenario_name"
                    value={form.scenario_name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly Investment
                  </label>
                  <input
                    type="number"
                    name="monthly_investment"
                    value={form.monthly_investment}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expected Return (%)
                  </label>
                  <input
                    type="number"
                    name="expected_return"
                    value={form.expected_return}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Inflation (%)
                  </label>
                  <input
                    type="number"
                    name="inflation"
                    value={form.inflation}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Years
                  </label>
                  <input
                    type="number"
                    name="years"
                    value={form.years}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Goal
                  </label>
                  <select
                    name="goal_id"
                    value={form.goal_id}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">No Goal</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.goal_type} - ₹{g.target_amount}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-500">
                  Save
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 dark:bg-gray-600
                    text-gray-800 dark:text-white
                    py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE */}
        {!showForm && simulations.length > 0 && (
          <div className="rounded-2xl shadow-lg p-6 mb-8 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
              Simulation Results
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead className="bg-blue-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3">Scenario</th>
                    <th>Total Invested</th>
                    <th>Future Value</th>
                    <th>Inflation Adjusted</th>
                    <th>Result</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {simulations.map((sim) => (
                    <tr key={sim.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2">{sim.scenario_name}</td>
                      <td>₹{sim.results.total_invested}</td>
                      <td className="text-green-600">₹{sim.results.future_value}</td>
                      <td className="text-orange-600">₹{sim.results.inflation_adjusted_value}</td>
                       <td className="p-2 font-medium">
                        {sim.results?.status === "surplus" ? (
                          <span className="text-green-600">Surplus</span>
                        ) : sim.results?.status === "shortfall" ? (
                          <span className="text-red-600">Shortfall</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => viewSimulation(sim.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHART */}
        {!showForm && selectedSimulation && (
          <div className="rounded-2xl shadow-lg p-6 mb-6 bg-white dark:bg-gray-800 relative">
            <button
              onClick={() => setSelectedSimulation(null)}
              className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
              Invested vs Future Value
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={generateGrowthData(selectedSimulation)}
                margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
              >
                <CartesianGrid stroke="none" />
                <XAxis dataKey="year" />
                <YAxis tickMargin={15} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="invested" stroke="#2563eb" name="Invested Amount" strokeWidth={2}/>
                <Line type="monotone" dataKey="future" stroke="#16a34a" name="Future Value" strokeWidth={2}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}
