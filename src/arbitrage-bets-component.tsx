import React, { useState, useEffect, useMemo } from 'react';
import { Circle, Square, Search, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { useArbitrageLiveData } from './hooks/useLiveOrderbooks';
import { getMatchesWithSameConditions, subscribe } from './state/matches-store';
import { calculateAllArbitrageOpportunities, sortOpportunitiesByAPR, formatAPR, formatProfit } from './lib/arbitrage';
import { ArbitrageOpportunity } from './api/types';

const ArbitrageBets = () => {
  const [activeTab, setActiveTab] = useState('pre-match');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);

  // Get live market data
  const { allMarkets, loading, error, refresh } = useArbitrageLiveData();
  
  // Get matched markets from store
  const [matches, setMatches] = useState(getMatchesWithSameConditions());

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setMatches(getMatchesWithSameConditions());
    });
    return unsubscribe;
  }, []);

  // Calculate arbitrage opportunities from live data
  const arbitrageOpportunities = useMemo(() => {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const match of matches) {
      // Find live market data
      const kalshiMarket = allMarkets.find(m => m.id === match.kalshiMarketId && m.platform === 'Kalshi');
      const polymarketMarket = allMarkets.find(m => m.id === match.polyMarketId && m.platform === 'Polymarket');

      if (kalshiMarket && polymarketMarket) {
        const matchOpportunities = calculateAllArbitrageOpportunities(
          kalshiMarket,
          polymarketMarket,
          match.conditionMappings
        );
        opportunities.push(...matchOpportunities);
      }
    }

    return sortOpportunitiesByAPR(opportunities);
  }, [matches, allMarkets]);

  // Filter opportunities based on search
  const filteredOpportunities = arbitrageOpportunities.filter(opportunity =>
    opportunity.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.conditionMapping.kalshi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.conditionMapping.polymarket.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const ExpandedConditions = ({ opportunity }) => (
    <tr>
      <td colSpan="10" className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Kalshi Conditions */}
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Kalshi Market: {opportunity.kalshiMarket.title}</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunity.kalshiMarket.conditions.map((condition, idx) => (
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
                <h4 className="text-sm font-semibold text-purple-400 mb-3">Polymarket Market: {opportunity.polymarketMarket.title}</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunity.polymarketMarket.conditions.map((condition, idx) => (
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
            
            {/* Arbitrage Details */}
            <div className="mt-4 bg-gray-700 rounded p-3">
              <h5 className="text-sm font-semibold text-yellow-400 mb-2">Arbitrage Analysis</h5>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Min Yes Cost</div>
                  <div className="text-green-400">{(opportunity.minYes * 100).toFixed(1)}¢</div>
                </div>
                <div>
                  <div className="text-gray-400">Min No Cost</div>
                  <div className="text-red-400">{(opportunity.minNo * 100).toFixed(1)}¢</div>
                </div>
                <div>
                  <div className="text-gray-400">Total Cost (C)</div>
                  <div className="text-white">{(opportunity.costSum * 100).toFixed(1)}¢</div>
                </div>
                <div>
                  <div className="text-gray-400">Period Return</div>
                  <div className="text-yellow-400">{(opportunity.periodReturn * 100).toFixed(2)}%</div>
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
            
            <button className="p-2 hover:bg-gray-800 rounded">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Info Bar */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              {loading ? 'Loading live data...' : 
               error ? `API Error: ${error}` :
               `${filteredOpportunities.length} arbitrage opportunities from ${matches.length} matched markets`}
            </span>
            {error && (
              <button 
                onClick={refresh}
                className="text-blue-400 text-sm hover:text-blue-300 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </button>
            )}
          </div>
          <button className="text-blue-400 text-sm hover:text-blue-300">Learn more →</button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            className="px-4 py-2 rounded-t-lg text-sm font-medium bg-gray-800 text-white"
          >
            Live Arbitrage <span className="ml-1 text-xs bg-gray-700 px-2 py-1 rounded">{filteredOpportunities.length}</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                <th className="p-3">APR ↓</th>
                <th className="p-3">Event Name</th>
                <th className="p-3">End Time</th>
                <th className="p-3">Days Until Close</th>
                <th className="p-3">Matched Conditions</th>
                <th className="p-3">Best Prices</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Profit on $100</th>
                <th className="p-3">Updated</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    {loading ? 'Loading arbitrage opportunities...' : 
                     error ? 'Error loading data. Please check API connections.' :
                     matches.length === 0 ? 'No matched markets found. Use Market Matcher to create matches first.' :
                     'No arbitrage opportunities found at current prices.'}
                  </td>
                </tr>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <React.Fragment key={opportunity.id}>
                    <tr 
                      className="border-t border-gray-800 hover:bg-gray-800 cursor-pointer"
                      onClick={() => toggleRowExpansion(opportunity.id)}
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Square className="w-4 h-4 text-gray-600" />
                          <Circle className="w-4 h-4 text-blue-500" />
                          <span className="text-green-400 font-medium">{formatAPR(opportunity.annualizedReturn)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{opportunity.eventName}</div>
                        <div className="text-xs text-gray-500">
                          {opportunity.kalshiMarket.category} | {opportunity.kalshiMarket.platform} ↔ {opportunity.polymarketMarket.platform}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm">
                          {opportunity.earliestEndTime.toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm">{opportunity.daysUntilClose} days</span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="text-green-400">{opportunity.conditionMapping.kalshi}</div>
                          <div className="text-purple-400">{opportunity.conditionMapping.polymarket}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1 text-sm">
                          <div className="text-green-400">Yes: {(opportunity.minYes * 100).toFixed(1)}¢</div>
                          <div className="text-red-400">No: {(opportunity.minNo * 100).toFixed(1)}¢</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{(opportunity.costSum * 100).toFixed(1)}¢</div>
                        <div className="text-xs text-gray-500">per $1</div>
                      </td>
                      <td className="p-3">
                        <div className="text-green-400 font-medium">{formatProfit(opportunity.profitOnHundred)}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-gray-400">
                          {opportunity.lastUpdated.toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-400 transform transition-transform ${
                            expandedRows.includes(opportunity.id) ? 'rotate-180' : ''
                          }`} 
                        />
                      </td>
                    </tr>
                    {expandedRows.includes(opportunity.id) && <ExpandedConditions opportunity={opportunity} />}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Settings and Refresh buttons */}
        <div className="fixed bottom-6 right-6 flex space-x-2">
          <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={refresh}
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
