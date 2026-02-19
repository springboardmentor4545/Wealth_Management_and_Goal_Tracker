import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardGraphs = ({ portfolioData, goalsData }) => {
  
  // 1. Portfolio Growth Over Time (Line Chart)
  const portfolioGrowthData = {
    labels: portfolioData?.monthly_snapshots?.map(s => s.date) || [],
    datasets: [{
      label: 'Portfolio Value',
      data: portfolioData?.monthly_snapshots?.map(s => s.value) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // 2. Asset Allocation Breakdown (Pie Chart)
  const allocationData = {
    labels: ['Equity', 'Debt', 'Cash'],
    datasets: [{
      data: [
        portfolioData?.allocation?.equity || 0,
        portfolioData?.allocation?.debt || 0,
        portfolioData?.allocation?.cash || 0
      ],
      backgroundColor: [
        'rgb(147, 51, 234)',  // Purple
        'rgb(236, 72, 153)',   // Pink
        'rgb(16, 185, 129)'    // Green
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // 3. Invested vs Current Value (Bar Chart)
  const investedVsCurrentData = {
    labels: ['Portfolio'],
    datasets: [
      {
        label: 'Total Invested',
        data: [portfolioData?.total_invested || 0],
        backgroundColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Current Value',
        data: [portfolioData?.current_value || 0],
        backgroundColor: 'rgb(147, 51, 234)',
      }
    ]
  };

  // 4. Goal Progress Tracking (Horizontal Bar)
  const goalProgressData = {
    labels: goalsData?.map(g => g.goal_type) || [],
    datasets: [{
      label: 'Progress %',
      data: goalsData?.map(g => {
        const progress = (g.current_amount / g.target_amount * 100);
        return Math.min(progress, 100);
      }) || [],
      backgroundColor: goalsData?.map(g => {
        const progress = (g.current_amount / g.target_amount * 100);
        return progress >= 100 ? 'rgb(16, 185, 129)' : 
               progress >= 50 ? 'rgb(234, 179, 8)' : 
               'rgb(239, 68, 68)';
      }) || [],
      borderRadius: 8
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Portfolio Growth Over Time' }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value.toLocaleString('en-IN')}`
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Asset Allocation Breakdown' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Invested vs Current Value' }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value.toLocaleString('en-IN')}`
        }
      }
    }
  };

  const horizontalBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Goal Progress Tracking' }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Portfolio Growth */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div style={{ height: '300px' }}>
          <Line data={portfolioGrowthData} options={lineOptions} />
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div style={{ height: '300px' }}>
          <Pie data={allocationData} options={pieOptions} />
        </div>
      </div>

      {/* Invested vs Current */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div style={{ height: '300px' }}>
          <Bar data={investedVsCurrentData} options={barOptions} />
        </div>
      </div>

      {/* Goal Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div style={{ height: '300px' }}>
          <Bar data={goalProgressData} options={horizontalBarOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardGraphs;