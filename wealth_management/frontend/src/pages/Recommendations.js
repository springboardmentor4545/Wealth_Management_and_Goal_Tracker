import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "hotpink",
  "orange",
  "yellowgreen",
  "mediumturquoise",
  "dodgerblue",
  "mediumseagreen",
  "goldenrod",
  "purple",
  "tomato",
  "cyan",
];

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    try {
      setLoading(true);

      
      const res = await api.get("/recommendation/");
      const rec = res.data;

      setData({
        risk_profile: rec.risk_profile,
        recommended_allocation: rec.recommended_allocation,
        current_allocation: rec.current_allocation,
        rebalance_suggestions: rec.recommendations,
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading recommendations...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center">No recommendation data</div>;
  }

  const recommendedData = Object.entries(data.recommended_allocation).map(
    ([key, value]) => ({ name: key, value: Number(value) })
  );

  const currentData = Object.entries(data.current_allocation).map(
    ([key, value]) => ({ name: key, value: Number(value) })
  );

  const equitySuggestions = data.rebalance_suggestions.filter(
    (s) => s.asset_class === "Equity"
  );

  const debtSuggestions = data.rebalance_suggestions.filter(
    (s) => s.asset_class === "Debt"
  );

  const cashSuggestions = data.rebalance_suggestions.filter(
    (s) => s.asset_class === "Cash"
  );


  return (
    <div className="py-4 px-4">
      <div className="max-w-6xl mx-auto pt-8">

        <h2 className="text-2xl font-bold mb-8 text-blue-800 dark:text-blue-300">
          Portfolio Recommendations
        </h2>

        <div className="rounded-2xl shadow-lg text-center p-6 mb-8 bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-300">
            Your Risk Profile
          </h3>
          <p className="text-lg capitalize font-medium">
            {data.risk_profile}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          <ChartCard title="Recommended Allocation" data={recommendedData} />
          <ChartCard title="Current Portfolio Allocation" data={currentData} />

        </div>

        <div className="rounded-2xl shadow-lg p-6 mb-8 bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold mb-6 text-blue-700 dark:text-blue-300">
            Rebalancing Suggestions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <SuggestionCard title="Equity" items={equitySuggestions} />
            <SuggestionCard title="Debt" items={debtSuggestions} />
            <SuggestionCard title="Cash" items={cashSuggestions} />

          </div>
        </div>

      </div>
    </div>
  );
}

function ChartCard({ title, data }) {
  return (
    <div className="rounded-2xl shadow-lg p-6 bg-white dark:bg-gray-800">
      <h3 className="text-xl font-semibold mb-6 text-blue-700 dark:text-blue-300 text-center">
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} dataKey="value" label>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function SuggestionCard({ title, items }) {
  const smallCard =
    "rounded-xl border p-4 shadow-sm bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600";

  return (
    <div className={smallCard}>
      <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
        {title}
      </h4>

      {items.length > 0 ? (
        <ul className="text-sm space-y-1">
          {items.map((s, i) => (
            <li key={i}>
              • {s.action} by {s.change_percent}%
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No changes suggested</p>
      )}
    </div>
  );
}
