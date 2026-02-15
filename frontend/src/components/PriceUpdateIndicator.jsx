import React, { useState, useEffect } from 'react';
import { getLastUpdateTime, triggerPriceUpdate } from '../api/marketData';
import { toast } from 'react-toastify';

const PriceUpdateIndicator = ({ onUpdateComplete }) => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchLastUpdate();
    // Auto-refresh last update time every minute
    const interval = setInterval(fetchLastUpdate, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLastUpdate = async () => {
    try {
      const data = await getLastUpdateTime();
      setLastUpdate(data.last_updated_at);
    } catch (err) {
      console.error('Failed to fetch last update time:', err);
      // Don't show error toast here, just log it
    }
  };

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    
    try {
      await triggerPriceUpdate();
      await fetchLastUpdate();
      
      // Notify parent component to refresh data
      if (onUpdateComplete) {
        onUpdateComplete();
      }
      
      toast.success('Prices updated successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error('Failed to update prices. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
      console.error('Error updating prices:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never updated';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-purple-100 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <div className="text-sm">
          <span className="text-gray-600">Market Data: </span>
          <span className="font-semibold text-gray-900">
            {formatLastUpdate(lastUpdate)}
          </span>
        </div>
      </div>
      
      <button
        onClick={handleManualUpdate}
        disabled={isUpdating}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
          transition-all duration-200 shadow-sm
          ${isUpdating 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-md transform hover:scale-105'
          }
        `}
      >
        {isUpdating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Updating...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Prices</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PriceUpdateIndicator;