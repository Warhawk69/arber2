import React, { useState, useMemo } from 'react';
import { Circle, Square, Search, Settings, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { useLiveOrderbooks } from './hooks/useLiveOrderbooks';
import { useMatchesStore } from './state/matches-store';
import { arbitrageCalculator } from './lib/arbitrage';
import { ArbitrageOpportunity } from './api/types';

const ArbitrageBets = () => {
  const [activeTab, setActiveTab] = useState('pre-match');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [minAPR, setMinAPR] = useState(1); // Minimum APR filter (1%)
  const [maxDays, setMaxDays] = useState(365); // Maximum days until close filter

  // Use live data hooks
  const { 
    kalshiMarkets, 
    polymarketMarkets, 
    arbitrageOpportunities,
    isLoading, 
    errors, 
    lastUpdated, 
    refresh 
  } = useLiveOrderbooks();
  
  const matchesStore = useMatchesStore();

  // Filter and process arbitrage opportunities
  const filteredOpportunities = useMemo(() => {
    let opportunities = arbitrageOpportunities;

    // Filter by search term
    if (searchTerm) {
      opportunities = opportunities.filter(opp =>
        opp.kalshiMarket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.polymarketMarket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.kalshiCondition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.polymarketCondition.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by minimum APR
    opportunities = arbitrageCalculator.filterByMinAPR(opportunities, minAPR / 100);

    // Filter by maximum days
    opportunities = arbitrageCalculator.filterByMaxDays(opportunities, maxDays);

    return opportunities;
  }, [arbitrageOpportunities, searchTerm, minAPR, maxDays]);

  // Calculate portfolio statistics
  const portfolioStats = useMemo(() => {
    return arbitrageCalculator.calculatePortfolioStats(filteredOpportunities);
  }, [filteredOpportunities]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const formatAPR = (apr: number): string => {
    return `${(apr * 100).toFixed(2)}%`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getVenueColor = (venue: string): string => {
    switch (venue.toLowerCase()) {
      case 'kalshi': return 'text-blue-400';
      case 'polymarket': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const ExpandedOpportunity = ({ opportunity }: { opportunity: ArbitrageOpportunity }) => (
    <tr>
      <td colSpan="10" className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Kalshi Market Details */}
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Kalshi Market</h4>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-400">Market</div>
                    <div className="text-sm font-medium">{opportunity.kalshiMarket.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Condition</div>
                    <div className="text-sm">{opportunity.kalshiCondition.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Yes Price</div>
                      <div className="text-sm text-green-400">
                        {(opportunity.kalshiCondition.yesPrice * 100).toFixed(0)}¢
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">No Price</div>
                      <div className="text-sm text-red-400">
                        {(opportunity.kalshiCondition.noPrice * 100).toFixed(0)}¢
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Close Time</div>
                    <div className="text-sm">{opportunity.kalshiMarket.closeTime.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Polymarket Market Details */}
              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-3">Polymarket Market</h4>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-400">Market</div>
                    <div className="text-sm font-medium">{opportunity.polymarketMarket.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Condition</div>
                    <div className="text-sm">{opportunity.polymarketCondition.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400">Yes Price</div>
                      <div className="text-sm text-green-400">
                        {(opportunity.polymarketCondition.yesPrice * 100).toFixed(0)}¢
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">No Price</div>
                      <div className="text-sm text-red-400">
                        {(opportunity.polymarketCondition.noPrice * 100).toFixed(0)}¢
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Close Time</div>
                    <div className="text-sm">{opportunity.polymarketMarket.closeTime.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arbitrage Details */}
            <div className="mt-6 bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-400 mb-3">Arbitrage Analysis</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Total Cost (C)</div>
                  <div className="text-sm font-medium">{formatCurrency(opportunity.totalCost)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Period Return</div>
                  <div className="text-sm font-medium text-green-400">
                    {(opportunity.periodReturn * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Days Until Close</div>
                  <div className="text-sm font-medium">{opportunity.daysUntilClose}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Best Strategy</div>
                  <div className="text-xs">
                    <div className={`${getVenueColor(opportunity.minYesVenue)}`}>
                      Buy YES on {opportunity.minYesVenue}
                    </div>
                    <div className={`${getVenueColor(opportunity.minNoVenue)}`}>
                      Buy NO on {opportunity.minNoVenue}
                    </div>
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
            {portfolioStats.totalOpportunities > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {portfolioStats.totalOpportunities} opportunities • 
                Avg APR: {formatAPR(portfolioStats.averageAPR)} • 
                Total Profit: {formatCurrency(portfolioStats.totalPotentialProfit)}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-400">Min APR:</div>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={minAPR}
                onChange={(e) => setMinAPR(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs"
              />
              <div className="text-xs text-gray-400">%</div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-400">Max days:</div>
              <input
                type="number"
                min="1"
                max="365"
                value={maxDays}
                onChange={(e) => setMaxDays(parseInt(e.target.value) || 365)}
                className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs"
              />
            </div>
            
            <button 
              onClick={refresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-800 rounded disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-red-500">API Errors:</div>
                {errors.slice(0, 2).map((error, idx) => (
                  <div key={idx} className="text-red-400 mt-1">{error.message}</div>
                ))}
                {errors.length > 2 && (
                  <div className="text-red-400 mt-1">...and {errors.length - 2} more errors</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Matches Warning */}
        {matchesStore.matches.length === 0 && !isLoading && (
          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-yellow-500">No Market Matches Found</div>
                <div className="text-yellow-400 mt-1">
                  Use the Market Matcher to create market matches before arbitrage opportunities can be detected.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="bg-gray-800 rounded-lg p-2 mb-4 text-xs text-gray-400 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()} • 
            {arbitrageOpportunities.length} total opportunities • 
            {filteredOpportunities.length} after filters
          </div>
        )}

        {/* Loading State */}
        {isLoading && filteredOpportunities.length === 0 && (
          <div className="bg-gray-900 rounded-lg p-8 mb-4 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Scanning for arbitrage opportunities...</p>
            <p className="text-xs text-gray-500 mt-2">
              Analyzing {kalshiMarkets.length} Kalshi markets and {polymarketMarkets.length} Polymarket markets
            </p>
          </div>
        )}
        {/* Info Bar */}
        {filteredOpportunities.length > 0 && (
          <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-300">
              💡 Found {filteredOpportunities.length} arbitrage opportunities! 
              Best APR: {formatAPR(arbitrageCalculator.getBestOpportunity(filteredOpportunities)?.annualizedReturn || 0)}
            </span>
            <button 
              onClick={() => {
                setMinAPR(5);
                setMaxDays(30);
              }}
              className="text-blue-400 text-sm hover:text-blue-300"
            >
              Show best opportunities →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            className="px-4 py-2 rounded-t-lg text-sm font-medium bg-gray-800 text-white"
          >
            Live Opportunities <span className="ml-1 text-xs bg-gray-700 px-2 py-1 rounded">{filteredOpportunities.length}</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                <th className="p-3">APR ↓</th>
                <th className="p-3">Event Name</th>
                <th className="p-3">Close Time</th>
                <th className="p-3">Days Left</th>
                <th className="p-3">Best Strategy</th>
                <th className="p-3">Min Prices</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Profit ($100)</th>
                <th className="p-3">Updated</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-gray-500">
                    {isLoading ? 'Loading arbitrage opportunities...' : 
                     matchesStore.matches.length === 0 ? 'Create market matches first to see arbitrage opportunities' :
                     'No arbitrage opportunities found with current filters'}
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
                          <span className="text-green-400 font-medium">
                            {formatAPR(opportunity.annualizedReturn)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {opportunity.kalshiMarket.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {opportunity.kalshiMarket.category} | {opportunity.kalshiCondition.name}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm">
                          {opportunity.earliestCloseTime.toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm">{opportunity.daysUntilClose}</span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-green-400">
                              YES: {opportunity.minYesVenue}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-red-400">
                              NO: {opportunity.minNoVenue}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`${getVenueColor(opportunity.minYesVenue)} font-medium`}>
                              {(opportunity.minYes * 100).toFixed(0)}¢
                            </span>
                            <span className="text-green-400 text-xs">YES</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`${getVenueColor(opportunity.minNoVenue)} font-medium`}>
                              {(opportunity.minNo * 100).toFixed(0)}¢
                            </span>
                            <span className="text-red-400 text-xs">NO</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {formatCurrency(opportunity.totalCost)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-green-400 font-medium">
                          +{formatCurrency(opportunity.profitOn100)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-gray-400">
                          {(() => {
                            const now = new Date();
                            const diffMs = now.getTime() - opportunity.updatedAt.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
                          })()}
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
                    {expandedRows.includes(opportunity.id) && <ExpandedOpportunity opportunity={opportunity} />}
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
          <button className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full shadow-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageBets;
