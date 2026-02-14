import { useEffect, useState } from "react";

function Recommendations() {
  const [data, setData] = useState(null);
  const [rebalance, setRebalance] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/recommendations/allocation")
      .then(res => res.json())
      .then(setData);

    fetch("http://127.0.0.1:8000/recommendations/rebalance")
      .then(res => res.json())
      .then(setRebalance);
  }, []);

  if (!data || !rebalance) return <p>Loading recommendations...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Portfolio Recommendations</h2>

      <h3>Risk Profile</h3>
      <p>{data.risk_profile.toUpperCase()}</p>

      <h3>Recommended Allocation</h3>
      <ul>
        <li>Equity: {data.recommended.equity}%</li>
        <li>Debt: {data.recommended.debt}%</li>
        <li>Cash: {data.recommended.cash}%</li>
      </ul>

      <h3>Current Allocation</h3>
      <ul>
        <li>Equity: {data.current.equity}%</li>
        <li>Debt: {data.current.debt}%</li>
        <li>Cash: {data.current.cash}%</li>
      </ul>

      <h3>Rebalance Suggestions</h3>
      {rebalance.suggestions.length === 0 ? (
        <p>Portfolio is already balanced ✅</p>
      ) : (
        <ul>
          {rebalance.suggestions.map((s, i) => (
            <li key={i}>{s.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Recommendations;
