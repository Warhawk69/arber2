import React, { useState, useEffect } from 'react';
import { Circle, Square, Search, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { useLiveOrderbooks } from './hooks/useLiveOrderbooks';
import { getStore, subscribeToStore } from './state/matches-store';
import { ArbitrageOpportunity } from './api/types';

const ArbitrageBets = () => {
  const [activeTab, setActiveTab] = useState('pre-match');
  const [searchTerm, setSearchTerm] = useState('');
  const [arbitrageData, setArbitrageData] = useState<ArbitrageOpportunity[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Use live data hook
  const { loading, error, forceRefresh } = useLiveOrderbooks();

  // Subscribe to arbitrage opportunities from store
  useEffect(() => {
    const updateArbitrageData = () => {
      const store = getStore();
      setArbitrageData(store.arbitrageOpportunities);
    };

    // Initial load
    updateArbitrageData();

    // Subscribe to updates
    const unsubscribe = subscribeToStore(updateArbitrageData);
    return unsubscribe;
  }, []);

  const filteredData = arbitrageData.filter(item =>
    item.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleRefresh = () => {
    forceRefresh();
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const ExpandedConditions = ({ item }: { item: ArbitrageOpportunity }) => (
    <tr>
      <td colSpan="10" className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* All Conditions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">All Market Conditions</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Platform</th>
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.allConditions.map((condition, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            condition.platform === 'kalshi' 
                              ? 'bg-blue-900 text-blue-300' 
                              : 'bg-purple-900 text-purple-300'
                          }`}>
                            {condition.platform === 'kalshi' ? 'Kalshi' : 'Polymarket'}
                          </span>
                        </td>
                        <td className="py-2">{condition.condition}</td>
                        <td className="py-2 text-right text-green-400">{(condition.yesPrice * 100).toFixed(0)}¢</td>
                        <td className="py-2 text-right text-red-400">{(condition.noPrice * 100).toFixed(0)}¢</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Arbitrage Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Arbitrage Calculation</h4>
                <div className="space-y-3">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-xs text-gray-400">Best YES Price</div>
                    <div className="text-green-400 font-medium">
                      {(item.minYes * 100).toFixed(0)}¢ 
                      <span className="text-xs text-gray-400 ml-1">
                        ({item.yesBet.platform})
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-xs text-gray-400">Best NO Price</div>
                    <div className="text-red-400 font-medium">
                      {(item.minNo * 100).toFixed(0)}¢ 
                      <span className="text-xs text-gray-400 ml-1">
                        ({item.noBet.platform})
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-xs text-gray-400">Total Cost (C)</div>
                    <div className="text-yellow-400 font-medium">{(item.C * 100).toFixed(0)}¢</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-xs text-gray-400">Period Return</div>
                    <div className="text-blue-400 font-medium">{(item.periodReturn * 100).toFixed(2)}%</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-xs text-gray-400">Days to Close</div>
                    <div className="text-gray-300 font-medium">{item.daysUntilClose} days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Arbitrage Bets 🎯</h2>
            <p className="text-sm text-gray-400 mt-1">Real-time arbitrage opportunities across prediction markets</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <button onClick={handleRefresh} className="p-2 hover:bg-gray-800 rounded">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-4">
            <div className="text-red-300 text-sm">
              <strong>Connection Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && arbitrageData.length === 0 && (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading arbitrage opportunities...</div>
          </div>
        )}

        {/* No Data State */}
        {!loading && arbitrageData.length === 0 && !error && (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-2">No arbitrage opportunities found</div>
            <div className="text-xs text-gray-500">
              Opportunities appear when matched markets have profitable price differences
            </div>
          </div>
        )}
        {/* Info Bar */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-300">
            Click here to learn more about how to set up notifications for arbitrage bets
          </span>
          <button className="text-blue-400 text-sm hover:text-blue-300">Learn more →</button>
        </div>

        {/* Tabs - Only Pre-match now */}
        <div className="flex space-x-1 mb-4">
          <button
            className="px-4 py-2 rounded-t-lg text-sm font-medium bg-gray-800 text-white"
          >
            Pre-match <span className="ml-1 text-xs bg-gray-700 px-2 py-1 rounded">{filteredData.length}</span>
          </button>
        </div>

        {/* Table */}
        {arbitrageData.length > 0 && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                  <th className="p-3">APR ↓</th>
                  <th className="p-3">Event Name</th>
                  <th className="p-3">End Time</th>
                  <th className="p-3">Days Left</th>
                  <th className="p-3">Market</th>
                  <th className="p-3">Bets</th>
                  <th className="p-3">Odds</th>
                  <th className="p-3">Profit on $100</th>
                  <th className="p-3">Updated</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      className="border-t border-gray-800 hover:bg-gray-800 cursor-pointer"
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Square className="w-4 h-4 text-gray-600" />
                          <Circle className="w-4 h-4 text-blue-500" />
                          <span className="text-green-400 font-medium">{(item.apr * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{item.eventName}</div>
                        <div className="text-xs text-gray-500">{item.eventType}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm">{formatDate(item.earliestEndTime)}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm">{item.daysUntilClose}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{item.market}</span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-green-400">{item.yesBet.condition}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-red-400">{item.noBet.condition}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.yesBet.platform === 'kalshi' 
                                ? 'bg-blue-800 text-blue-300' 
                                : 'bg-purple-800 text-purple-300'
                            }`}>
                              {item.yesBet.platform === 'kalshi' ? 'Kalshi' : 'Polymarket'}
                            </span>
                            <span className="font-medium">{(item.yesBet.price * 100).toFixed(0)}¢</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.noBet.platform === 'kalshi' 
                                ? 'bg-blue-800 text-blue-300' 
                                : 'bg-purple-800 text-purple-300'
                            }`}>
                              {item.noBet.platform === 'kalshi' ? 'Kalshi' : 'Polymarket'}
                            </span>
                            <span className="font-medium">{(item.noBet.price * 100).toFixed(0)}¢</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-green-400 font-medium">+${item.profitOn100.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-gray-400">{formatTimeAgo(item.updatedAt)}</span>
                      </td>
                      <td className="p-3">
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-400 transform transition-transform ${
                            expandedRows.includes(item.id) ? 'rotate-180' : ''
                          }`} 
                        />
                      </td>
                    </tr>
                    {expandedRows.includes(item.id) && <ExpandedConditions item={item} />}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Settings and Refresh buttons */}
        <div className="fixed bottom-6 right-6 flex space-x-2">
          <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRefresh}
            className={`bg-blue-600 hover:bg-blue-700 p-3 rounded-full shadow-lg ${loading ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageBets;
