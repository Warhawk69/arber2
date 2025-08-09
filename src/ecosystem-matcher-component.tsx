import React, { useState, useEffect } from 'react';
import { Search, Check, X, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useMarketData } from './api/polling';
import type { Market } from './types';

const EcosystemMatcher = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedMarkets, setSelectedMarkets] = useState<(Market & { exchange: string })[]>([]);
  const [searchTermKalshi, setSearchTermKalshi] = useState('');
  const [searchTermPoly, setSearchTermPoly] = useState('');
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<any>(null);

  // Use live data instead of mock data
  const { kalshiMarkets, polymarketMarkets, loading, error, refreshData } = useMarketData();

  // Simple ecosystem history state (in a real app, this would be persisted)
  const [ecosystemHistory, setEcosystemHistory] = useState<any[]>([]);

  const EcosystemConditionMatcher = () => {
    // Simplified condition matcher for demo
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Ecosystem Condition Matcher</h3>
            <button onClick={() => setShowConditionMatcher(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-400">
            <p>Condition matching functionality will be available in a future version.</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setShowConditionMatcher(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filter markets based on search
  const filteredKalshiMarkets = kalshiMarkets.filter(market =>
    market.title.toLowerCase().includes(searchTermKalshi.toLowerCase()) ||
    market.id.toLowerCase().includes(searchTermKalshi.toLowerCase())
  );

  const filteredPolyMarkets = polymarketMarkets.filter(market =>
    market.title.toLowerCase().includes(searchTermPoly.toLowerCase()) ||
    market.id.toLowerCase().includes(searchTermPoly.toLowerCase())
  );

  const toggleMarketSelection = (market, exchange) => {
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

  const isMarketSelected = (market, exchange) => {
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
    
    // Create new ecosystem
    const newEcosystem = {
      id: Date.now(),
      name: `New Ecosystem - ${new Date().toLocaleDateString()}`,
      createdDate: new Date().toISOString().split('T')[0],
      exchanges: exchanges,
      markets: selectedMarkets.length,
      conditions: totalConditions,
      status: 'active',
      conditionsMatched: false,
      conditionMappings: [],
      marketData: selectedMarkets.map(m => ({
        exchange: m.exchange,
        market: m.title,
        conditions: m.conditions
      }))
    };
    
    setEcosystemHistory([newEcosystem, ...ecosystemHistory]);
    setSelectedMarkets([]);
    alert(`Created ecosystem with ${selectedMarkets.length} markets from ${exchanges} exchange(s)`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3">
          <h2 className="text-xl font-semibold">Ecosystem Matcher</h2>
          <p className="text-sm text-gray-400 mt-1">Create ecosystems by matching multiple markets across exchanges</p>
        </div>
      </div>

      <div className="p-4">
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
                  {filteredKalshiMarkets.map(market => (
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
                            {market.category} • ${(market.volume / 1000).toFixed(0)}k vol • {market.conditions.length} conditions
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Closes {market.closeDate}</div>
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
                  ))}
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
                  {filteredPolyMarkets.map(market => (
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
                            {market.category} • ${(market.volume / 1000).toFixed(0)}k vol • {market.conditions.length} conditions
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Closes {market.closeDate}</div>
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
                  ))}
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
                {ecosystemHistory.map((ecosystem) => (
                  <tr key={ecosystem.id} className="border-t border-gray-800 hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium text-sm">{ecosystem.name}</div>
                    </td>
                    <td className="p-3 text-sm">{ecosystem.createdDate}</td>
                    <td className="p-3 text-sm">{ecosystem.exchanges}</td>
                    <td className="p-3 text-sm">{ecosystem.markets}</td>
                    <td className="p-3 text-sm">{ecosystem.conditions}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        ecosystem.status === 'active' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {ecosystem.status}
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
                            setSelectedEcosystem(ecosystem);
                            setShowConditionMatcher(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit condition mappings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-blue-400 hover:text-blue-300 text-sm">View Details</button>
                      </div>
                    </td>
                  </tr>
                ))}
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
