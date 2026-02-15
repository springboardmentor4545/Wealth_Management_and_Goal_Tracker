import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SimulationResults = ({ simulation }) => {
  if (!simulation || !simulation.results) {
    return null;
  }

  const { results, assumptions } = simulation;

  // Format currency
  const formatCurrency = (value) => {
    return `₹${parseFloat(value).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Prepare chart data
  const chartData = {
    labels: results.yearly_projections.map(y => `Year ${y.year}`),
    datasets: [
      {
        label: 'Portfolio Value',
        data: results.yearly_projections.map(y => y.value),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Amount Invested',
        data: results.yearly_projections.map(y => y.invested),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Real Value (Inflation Adjusted)',
        data: results.yearly_projections.map(y => y.real_value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Future Value Projection'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const achievementPercent = results.achievement_percent || 
    (assumptions.target_amount ? (results.final_value / assumptions.target_amount * 100).toFixed(2) : null);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl p-6">
          <h3 className="text-sm font-medium opacity-90 mb-2">Final Value</h3>
          <p className="text-3xl font-bold">{formatCurrency(results.final_value)}</p>
          <p className="text-xs opacity-75 mt-2">In {assumptions.time_horizon_years} years</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Invested</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(results.total_invested)}</p>
          <p className="text-xs text-gray-500 mt-2">Principal + Contributions</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Returns</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(results.total_returns)}</p>
          <p className="text-xs text-gray-500 mt-2">CAGR: {results.cagr_percent}%</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Real Value</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(results.real_value_adjusted)}</p>
          <p className="text-xs text-gray-500 mt-2">Inflation Adjusted</p>
        </div>
      </div>

      {/* Target Achievement */}
      {assumptions.target_amount && (
        <div className={`rounded-xl p-6 border-2 ${
          results.shortfall_surplus >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Target Achievement</h3>
              <p className="text-sm text-gray-600">Goal: {formatCurrency(assumptions.target_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{achievementPercent}%</p>
              <p className={`text-sm font-medium ${
                results.shortfall_surplus >= 0 ? 'text-green-600' : 'text-amber-600'
              }`}>
                {results.shortfall_surplus >= 0 ? 'Surplus' : 'Shortfall'}: {formatCurrency(Math.abs(results.shortfall_surplus))}
              </p>
            </div>
          </div>

          {results.shortfall_surplus < 0 && results.required_monthly_contribution && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-700">
                💡 <strong>Recommendation:</strong> To reach your target, increase monthly contribution to{' '}
                <span className="font-bold text-purple-600">
                  {formatCurrency(results.required_monthly_contribution)}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Yearly Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Year</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Portfolio Value</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Invested</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Returns</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Real Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.yearly_projections.map((year) => (
                <tr key={year.year} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Year {year.year}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(year.value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(year.invested)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                    {formatCurrency(year.returns)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {formatCurrency(year.real_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimulationResults;