import React, { useState, useMemo } from 'react';
import { Search, Check, X, CheckCircle, XCircle, Edit2, RefreshCw } from 'lucide-react';
import { useLiveOrderbooks } from './hooks/useLiveOrderbooks';
import { useMatchesStore } from './state/matches-store';
import { CommonMarket } from './api/types';

const EcosystemMatcher = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedMarkets, setSelectedMarkets] = useState<Array<CommonMarket & { exchange: string }>>([]);
  const [searchTermKalshi, setSearchTermKalshi] = useState('');
  const [searchTermPoly, setSearchTermPoly] = useState('');
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<any>(null);

  // Use live data hooks
  const { 
    kalshiMarkets, 
    polymarketMarkets, 
    isLoading, 
    errors, 
    lastUpdated, 
    refresh 
  } = useLiveOrderbooks();
  
  const matchesStore = useMatchesStore();

  // Filter markets based on search
  const filteredKalshiMarkets = useMemo(() => {
    return kalshiMarkets.filter(market =>
      market.title.toLowerCase().includes(searchTermKalshi.toLowerCase()) ||
      market.id.toLowerCase().includes(searchTermKalshi.toLowerCase())
    );
  }, [kalshiMarkets, searchTermKalshi]);

  const filteredPolyMarkets = useMemo(() => {
    return polymarketMarkets.filter(market =>
      market.title.toLowerCase().includes(searchTermPoly.toLowerCase()) ||
      market.id.toLowerCase().includes(searchTermPoly.toLowerCase())
    );
  }, [polymarketMarkets, searchTermPoly]);

  const toggleMarketSelection = (market: CommonMarket, exchange: string) => {
    const marketWithExchange = { ...market, exchange };
    const marketId = `${exchange}-${market.id}`;
    
    setSelectedMarkets(prev => {
      const isSelected = prev.some(m => `${m.exchange}-${m.id}` === marketId);
      if (isSelected) {
        return prev.filter(m => `${m.exchange}-${m.id}` !== marketId);
      } else {
        return [...prev, marketWithExchange];
      }
    });
  };

  const isMarketSelected = (market: CommonMarket, exchange: string) => {
    const marketId = `${exchange}-${market.id}`;
    return selectedMarkets.some(m => `${m.exchange}-${m.id}` === marketId);
  };

  const handleCreateEcosystem = () => {
    if (selectedMarkets.length === 0) {
      alert('Please select at least one market to create an ecosystem');
      return;
    }
    
    const exchanges = new Set(selectedMarkets.map(m => m.exchange)).size;
    const totalConditions = selectedMarkets.reduce((sum, m) => sum + m.conditions.length, 0);
    
    // Create new ecosystem using the store
    matchesStore.addEcosystem({
      name: `Ecosystem - ${new Date().toLocaleDateString()}`,
      marketRefs: selectedMarkets.map(m => ({
        platform: m.platform,
        marketId: m.id,
      })),
      conditionMappings: [],
      conditionsMatched: false,
    });
    
    setSelectedMarkets([]);
    alert(`Created ecosystem with ${selectedMarkets.length} markets from ${exchanges} exchange(s)`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Ecosystem Matcher</h2>
            <p className="text-sm text-gray-400 mt-1">Create ecosystems by matching multiple markets across exchanges</p>
            {lastUpdated && (
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()} • 
                Kalshi: {kalshiMarkets.length} markets • 
                Polymarket: {polymarketMarkets.length} markets
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={refresh}
              disabled={isLoading}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-3 mb-4">
            <div className="text-sm text-red-400">
              API Errors: {errors.slice(0, 2).map(e => e.message).join(', ')}
            </div>
          </div>
        )}
        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'manual' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400'
            }`}
          >
            Manual Matching
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'history' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400'
            }`}
          >
            Ecosystem History
          </button>
        </div>

        {activeTab === 'manual' && (
          <div className="space-y-4">
            {/* Selection Info */}
            {selectedMarkets.length > 0 && (
              <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-sm text-blue-300">
                    {selectedMarkets.length} market{selectedMarkets.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="text-xs text-blue-200 mt-1">
                    {new Set(selectedMarkets.map(m => m.exchange)).size} exchange(s) • {' '}
                    {selectedMarkets.reduce((sum, m) => sum + m.conditions.length, 0)} total conditions
                  </div>
                </div>
                <button
                  onClick={handleCreateEcosystem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                >
                  Create Ecosystem
                </button>
              </div>
            )}

            {/* Market Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* Kalshi Markets */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Kalshi Markets</h3>
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search Kalshi markets..."
                      value={searchTermKalshi}
                      onChange={(e) => setSearchTermKalshi(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoading && filteredKalshiMarkets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Loading markets...</div>
                  ) : filteredKalshiMarkets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No markets found</div>
                  ) : (
                    filteredKalshiMarkets.map(market => (
                      <div
                        key={market.id}
                        onClick={() => toggleMarketSelection(market, 'Kalshi')}
                        className={`p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                          isMarketSelected(market, 'Kalshi') ? 'ring-2 ring-blue-500 bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{market.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {market.category} • ${((market.volume || 0) / 1000).toFixed(0)}k vol • {market.conditions.length} conditions
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Closes {market.closeTime.toLocaleDateString()}</div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ml-2 ${
                            isMarketSelected(market, 'Kalshi') 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-600'
                          }`}>
                            {isMarketSelected(market, 'Kalshi') && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Polymarket Markets */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">Polymarket Markets</h3>
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search Polymarket markets..."
                      value={searchTermPoly}
                      onChange={(e) => setSearchTermPoly(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isLoading && filteredPolyMarkets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Loading markets...</div>
                  ) : filteredPolyMarkets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No markets found</div>
                  ) : (
                    filteredPolyMarkets.map(market => (
                      <div
                        key={market.id}
                        onClick={() => toggleMarketSelection(market, 'Polymarket')}
                        className={`p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                          isMarketSelected(market, 'Polymarket') ? 'ring-2 ring-purple-500 bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{market.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {market.category} • ${((market.volume || 0) / 1000).toFixed(0)}k vol • {market.conditions.length} conditions
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Closes {market.closeTime.toLocaleDateString()}</div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ml-2 ${
                            isMarketSelected(market, 'Polymarket') 
                              ? 'bg-purple-500 border-purple-500' 
                              : 'border-gray-600'
                          }`}>
                            {isMarketSelected(market, 'Polymarket') && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Selected Markets Summary */}
            {selectedMarkets.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Selected Markets for Ecosystem</h3>
                <div className="space-y-2">
                  {selectedMarkets.map((market) => (
                    <div key={`${market.exchange}-${market.id}`} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                          market.exchange === 'Kalshi' 
                            ? 'bg-blue-900 text-blue-300' 
                            : 'bg-purple-900 text-purple-300'
                        }`}>
                          {market.exchange}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{market.title}</div>
                          <div className="text-xs text-gray-500">{market.conditions.length} conditions</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMarketSelection(market, market.exchange)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                  <th className="p-3">Ecosystem Name</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3"># of Exchanges</th>
                  <th className="p-3"># of Markets</th>
                  <th className="p-3"># of Conditions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Conditions Matched</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matchesStore.ecosystems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      No ecosystems created yet. Use the Manual Matching tab to create your first ecosystem.
                    </td>
                  </tr>
                ) : (
                  matchesStore.ecosystems.map((ecosystem) => {
                    const exchanges = new Set(ecosystem.marketRefs.map(ref => ref.platform)).size;
                    const markets = ecosystem.marketRefs.length;
                    
                    return (
                      <tr key={ecosystem.id} className="border-t border-gray-800 hover:bg-gray-800">
                        <td className="p-3">
                          <div className="font-medium text-sm">{ecosystem.name}</div>
                        </td>
                        <td className="p-3 text-sm">{ecosystem.createdAt.toLocaleDateString()}</td>
                        <td className="p-3 text-sm">{exchanges}</td>
                        <td className="p-3 text-sm">{markets}</td>
                        <td className="p-3 text-sm">
                          {ecosystem.marketRefs.reduce((sum, ref) => {
                            const market = [...kalshiMarkets, ...polymarketMarkets].find(m => m.id === ref.marketId);
                            return sum + (market?.conditions.length || 0);
                          }, 0)}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-900 text-green-300">
                            active
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            {ecosystem.conditionsMatched ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                                <span className="text-sm text-green-400">Yes</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm text-yellow-400">No</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                // Note: This would need to be updated to work with new ecosystem structure
                                // setSelectedEcosystem(ecosystem);
                                // setShowConditionMatcher(true);
                                alert('Condition mapping for new ecosystem structure coming soon');
                              }}
                              className="text-blue-400 hover:text-blue-300"
                              title="Edit condition mappings"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => matchesStore.removeEcosystem(ecosystem.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showConditionMatcher && <EcosystemConditionMatcher />}
    </div>
  );
};

export default EcosystemMatcher;
