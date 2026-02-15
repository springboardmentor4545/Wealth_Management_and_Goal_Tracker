// Market Data API Service
// This file handles all API calls related to market data and price updates

const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI backend URL

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Trigger manual price update for all investments
 * This calls your backend to fetch latest prices from the market data source
 */
export const triggerPriceUpdate = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/market-data/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to trigger price update');
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering price update:', error);
    throw error;
  }
};

/**
 * Get last price update timestamp
 * Returns when prices were last updated for the user's portfolio
 */
export const getLastUpdateTime = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/market-data/last-update`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch last update time');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching last update time:', error);
    throw error;
  }
};

/**
 * Fetch current market prices for all user investments
 * Returns array of prices with symbols
 */
export const fetchMarketPrices = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/market-data/prices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch market prices');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market prices:', error);
    throw error;
  }
};

/**
 * Fetch market price for a specific symbol
 */
export const fetchSymbolPrice = async (symbol) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/market-data/price/${symbol}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch price for ${symbol}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
};