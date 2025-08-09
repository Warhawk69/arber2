import React, { useState, useEffect } from 'react';
import { Circle, Square, Search, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { useMatchStore } from './utils/matchStore';
import { calculateMultipleArbitrageOpportunities, formatArbitrageForDisplay } from './utils/arbitrage';
import type { ArbitrageOpportunity } from './types';

const ArbitrageBets = () => {
  const [activeTab, setActiveTab] = useState('pre-match');
  const [searchTerm, setSearchTerm] = useState('');
  const [arbitrageData, setArbitrageData] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get matches with conditions from the store
  const { getMatchesWithConditions } = useMatchStore();

  // Load and calculate arbitrage opportunities
  useEffect(() => {
    const loadArbitrageOpportunities = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const matchesWithConditions = getMatchesWithConditions();
        
        if (matchesWithConditions.length === 0) {
          setArbitrageData([]);
          setLoading(false);
          return;
        }

        // Calculate arbitrage opportunities
        const opportunities = await calculateMultipleArbitrageOpportunities(matchesWithConditions);
        
        // Format for display using the existing UI structure
        const formattedData = opportunities.map(opp => formatArbitrageForDisplay(opp));
        
        setArbitrageData(formattedData);
      } catch (err) {
        console.error('Error loading arbitrage opportunities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load arbitrage opportunities');
        setArbitrageData([]);
      } finally {
        setLoading(false);
      }
    };

    loadArbitrageOpportunities();
    
    // Set up interval to refresh arbitrage data periodically
    const interval = setInterval(loadArbitrageOpportunities, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [getMatchesWithConditions]);

  // Manual refresh function
  const refreshArbitrageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const matchesWithConditions = getMatchesWithConditions();
      const opportunities = await calculateMultipleArbitrageOpportunities(matchesWithConditions);
      const formattedData = opportunities.map(opp => formatArbitrageForDisplay(opp));
      setArbitrageData(formattedData);
    } catch (err) {
      console.error('Error refreshing arbitrage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh arbitrage data');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = arbitrageData.filter(item =>
    item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const ExpandedConditions = ({ item }: { item: any }) => (
    <tr>
      <td colSpan={10} className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Kalshi Conditions */}
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Kalshi Conditions</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.kalshiConditions.map((condition: any, idx: number) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2">{condition.name}</td>
                        <td className="py-2 text-right text-green-400">{(condition.yesPrice * 100).toFixed(0)}¢</td>
                        <td className="py-2 text-right text-red-400">{(condition.noPrice * 100).toFixed(0)}¢</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Polymarket Conditions */}
              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-3">Polymarket Conditions</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.polymarketConditions.map((condition: any, idx: number) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-2">{condition.name}</td>
                        <td className="py-2 text-right text-green-400">{(condition.yesPrice * 100).toFixed(0)}¢</td>
                        <td className="py-2 text-right text-red-400">{(condition.noPrice * 100).toFixed(0)}¢</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            
            <button 
              onClick={refreshArbitrageData}
              className="p-2 hover:bg-gray-800 rounded"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Error State */}
        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <span className="text-red-300">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-400">Calculating arbitrage opportunities...</p>
          </div>
        )}

        {/* No opportunities message */}
        {!loading && !error && arbitrageData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No arbitrage opportunities found.</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure you have matched markets with condition mappings in the Market Matcher.
            </p>
          </div>
        )}
        {/* Tabs - Only Pre-match now */}
        {!loading && !error && arbitrageData.length > 0 && (
          <>
            <div className="flex space-x-1 mb-4">
              <button
                className="px-4 py-2 rounded-t-lg text-sm font-medium bg-gray-800 text-white"
              >
                Pre-match <span className="ml-1 text-xs bg-gray-700 px-2 py-1 rounded">{filteredData.length}</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                    <th className="p-3">Percent ↓</th>
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Start Time</th>
                    <th className="p-3">Market</th>
                    <th className="p-3">Bets</th>
                    <th className="p-3">Odds</th>
                    <th className="p-3">Stake</th>
                    <th className="p-3">Profit</th>
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
                            <span className="text-green-400 font-medium">{item.percentage.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{item.event}</div>
                          <div className="text-xs text-gray-500">{item.eventType}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-sm">{item.startTime}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{item.market}</span>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {item.bets.map((bet: any, i: number) => (
                              <div key={i} className="text-sm">
                                {i === 0 ? (
                                  <span className="text-green-400">{bet.outcome}</span>
                                ) : (
                                  <span className="text-red-400">{bet.outcome}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {item.bets.map((bet: any, i: number) => (
                              <div key={i} className="flex items-center space-x-2 text-sm">
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                                  {bet.venue}
                                </span>
                                <span className="font-medium">{bet.odds}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-medium">${item.totalStake}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-green-400 font-medium">+${item.profit.toFixed(2)}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-gray-400">{item.updated}</span>
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
          </>
        )}

        {/* Settings and Refresh buttons */}
        <div className="fixed bottom-6 right-6 flex space-x-2">
          <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={refreshArbitrageData}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full shadow-lg"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageBets;
