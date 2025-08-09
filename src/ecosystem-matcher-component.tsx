import React, { useState, useEffect } from 'react';
import { Search, Check, X, CheckCircle, XCircle, Edit2 } from 'lucide-react';

const EcosystemMatcher = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [searchTermKalshi, setSearchTermKalshi] = useState('');
  const [searchTermPoly, setSearchTermPoly] = useState('');
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState(null);

  // Mock data for markets
  const [kalshiMarkets] = useState([
    {
      id: 'FED-SEPT-2025',
      title: 'Fed decision in September?',
      category: 'Economics',
      volume: 450000,
      liquidity: 120000,
      closeDate: '2025-09-18',
      conditions: [
        { name: '25 bps decrease', yesPrice: 0.80, noPrice: 0.20 },
        { name: 'No change', yesPrice: 0.15, noPrice: 0.85 },
        { name: '25+ bps increase', yesPrice: 0.01, noPrice: 0.99 }
      ]
    },
    {
      id: 'BTCPRICE-25DEC31',
      title: 'Bitcoin above $100k by year end?',
      category: 'Crypto',
      volume: 890000,
      liquidity: 250000,
      closeDate: '2025-12-31',
      conditions: [
        { name: 'Yes', yesPrice: 0.40, noPrice: 0.60 },
        { name: 'No', yesPrice: 0.60, noPrice: 0.40 }
      ]
    },
    {
      id: 'ELECTION-2028-WINNER',
      title: 'Presidential Election Winner 2028',
      category: 'Politics',
      volume: 6000000,
      liquidity: 450000,
      closeDate: '2028-11-05',
      conditions: [
        { name: 'JD Vance', yesPrice: 0.28, noPrice: 0.72 },
        { name: 'Gavin Newsom', yesPrice: 0.13, noPrice: 0.87 },
        { name: 'Alexandria Ocasio-Cortez', yesPrice: 0.09, noPrice: 0.91 },
        { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93 },
        { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94 },
        { name: 'Andy Beshear', yesPrice: 0.05, noPrice: 0.95 },
        { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96 }
      ]
    }
  ]);

  const [polymarketMarkets] = useState([
    {
      id: '0xfedrate092025',
      title: 'Federal Reserve Rate Decision September 2025',
      category: 'Macro',
      volume: 420000,
      liquidity: 110000,
      closeDate: '2025-09-18',
      conditions: [
        { name: 'Rate decrease', yesPrice: 0.78, noPrice: 0.22 },
        { name: 'No change', yesPrice: 0.16, noPrice: 0.84 },
        { name: 'Rate increase', yesPrice: 0.02, noPrice: 0.98 }
      ]
    },
    {
      id: '0xbtc100keoy',
      title: 'BTC above $100,000 by EOY',
      category: 'Cryptocurrency',
      volume: 670000,
      liquidity: 180000,
      closeDate: '2025-12-31',
      conditions: [
        { name: 'Yes', yesPrice: 0.38, noPrice: 0.62 },
        { name: 'No', yesPrice: 0.62, noPrice: 0.38 }
      ]
    },
    {
      id: '0x2028election',
      title: '2028 US Presidential Election',
      category: 'Politics',
      volume: 5200000,
      liquidity: 380000,
      closeDate: '2028-11-05',
      conditions: [
        { name: 'J.D. Vance', yesPrice: 0.27, noPrice: 0.73 },
        { name: 'Gavin Newsom', yesPrice: 0.14, noPrice: 0.86 },
        { name: 'AOC', yesPrice: 0.08, noPrice: 0.92 },
        { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93 },
        { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94 },
        { name: 'Andrew Beshear', yesPrice: 0.05, noPrice: 0.95 },
        { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96 }
      ]
    }
  ]);

  const [ecosystemHistory, setEcosystemHistory] = useState([
    {
      id: 1,
      name: 'Fed Rate Decision - September 2025',
      createdDate: '2025-08-01',
      exchanges: 4,
      markets: 6,
      conditions: 13,
      status: 'active',
      conditionsMatched: true,
      conditionMappings: [
        {
          conditions: {
            'Kalshi-Fed decision in September?': '25 bps decrease',
            'Polymarket-Federal Reserve Rate Decision September 2025': 'Rate decrease',
            'ProphetX-FOMC September Outcome': 'Dovish',
            'NoVig-Fed Rates Sep': null
          },
          relationship: 'same'
        },
        {
          conditions: {
            'Kalshi-Fed decision in September?': 'No change',
            'Polymarket-Federal Reserve Rate Decision September 2025': 'No change',
            'ProphetX-FOMC September Outcome': 'Neutral',
            'NoVig-Fed Rates Sep': null
          },
          relationship: 'same'
        }
      ],
      marketData: [
        {
          exchange: 'Kalshi',
          market: 'Fed decision in September?',
          conditions: [
            { name: '25 bps decrease', yesPrice: 0.80, noPrice: 0.20 },
            { name: 'No change', yesPrice: 0.15, noPrice: 0.85 },
            { name: '25+ bps increase', yesPrice: 0.01, noPrice: 0.99 }
          ]
        },
        {
          exchange: 'Polymarket',
          market: 'Federal Reserve Rate Decision September 2025',
          conditions: [
            { name: 'Rate decrease', yesPrice: 0.78, noPrice: 0.22 },
            { name: 'No change', yesPrice: 0.16, noPrice: 0.84 },
            { name: 'Rate increase', yesPrice: 0.02, noPrice: 0.98 }
          ]
        },
        {
          exchange: 'ProphetX',
          market: 'FOMC September Outcome',
          conditions: [
            { name: 'Hawkish', yesPrice: 0.40, noPrice: 0.60 },
            { name: 'Dovish', yesPrice: 0.35, noPrice: 0.65 },
            { name: 'Neutral', yesPrice: 0.25, noPrice: 0.75 }
          ]
        },
        {
          exchange: 'NoVig',
          market: 'Fed Rates Sep',
          conditions: [
            { name: 'Increase', yesPrice: 0.38, noPrice: 0.62 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: '2028 Presidential Election',
      createdDate: '2025-07-15',
      exchanges: 3,
      markets: 5,
      conditions: 21,
      status: 'active',
      conditionsMatched: false,
      conditionMappings: [],
      marketData: []
    }
  ]);

  const EcosystemConditionMatcher = () => {
    const [mappings, setMappings] = useState(
      selectedEcosystem?.conditionMappings || []
    );
    const [selectedConditions, setSelectedConditions] = useState({});
    const [selectedRelationship, setSelectedRelationship] = useState('same');

    const relationshipTypes = [
      { value: 'same', label: 'Same', color: 'text-green-400' },
      { value: 'subset', label: 'Subset', color: 'text-blue-400' },
      { value: 'mutually-exclusive', label: 'Mutually Exclusive', color: 'text-orange-400' },
      { value: 'complementary', label: 'Complementary', color: 'text-purple-400' },
      { value: 'opposites', label: 'Opposites', color: 'text-red-400' },
      { value: 'overlapping', label: 'Overlapping', color: 'text-yellow-400' }
    ];

    // Initialize selected conditions for each market
    useEffect(() => {
      const initialConditions = {};
      selectedEcosystem?.marketData.forEach(market => {
        const key = `${market.exchange}-${market.market}`;
        initialConditions[key] = '';
      });
      setSelectedConditions(initialConditions);
    }, [selectedEcosystem]);

    const addMapping = () => {
      // Check if at least one condition is selected
      const hasSelection = Object.values(selectedConditions).some(val => val !== '');
      if (!hasSelection) {
        alert('Please select at least one condition');
        return;
      }

      const newMapping = {
        conditions: { ...selectedConditions },
        relationship: selectedRelationship
      };
      
      setMappings([...mappings, newMapping]);
      
      // Reset selections
      const resetConditions = {};
      Object.keys(selectedConditions).forEach(key => {
        resetConditions[key] = '';
      });
      setSelectedConditions(resetConditions);
    };

    const removeMapping = (index) => {
      setMappings(mappings.filter((_, i) => i !== index));
    };

    const saveConditionMappings = () => {
      setEcosystemHistory(ecosystemHistory.map(ecosystem => 
        ecosystem.id === selectedEcosystem.id
          ? { ...ecosystem, conditionMappings: mappings, conditionsMatched: mappings.length > 0 }
          : ecosystem
      ));
      setShowConditionMatcher(false);
      setSelectedEcosystem(null);
    };

    const getRelationshipColor = (relationship) => {
      const rel = relationshipTypes.find(r => r.value === relationship);
      return rel ? rel.color : 'text-gray-400';
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Match Ecosystem Conditions</h3>
            <button onClick={() => setShowConditionMatcher(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-400 mb-1">Matching conditions for:</div>
              <div className="font-medium">{selectedEcosystem?.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedEcosystem?.marketData.length} markets across {selectedEcosystem?.exchanges} exchanges
              </div>
            </div>
          </div>

          {/* Conditions Grid */}
          <div className="mb-6 overflow-x-auto">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Market Conditions</h4>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${selectedEcosystem?.marketData.length || 1}, minmax(200px, 1fr))`, gap: '1rem' }}>
                {selectedEcosystem?.marketData.map((market, idx) => (
                  <div key={idx} className="bg-gray-700 rounded p-3">
                    <div className={`text-xs font-semibold mb-2 ${
                      market.exchange === 'Kalshi' ? 'text-blue-400' : 
                      market.exchange === 'Polymarket' ? 'text-purple-400' : 
                      'text-gray-400'
                    }`}>
                      {market.exchange}
                    </div>
                    <div className="text-sm font-medium mb-2">{market.market}</div>
                    <div className="space-y-1">
                      {market.conditions.map((condition, condIdx) => (
                        <div key={condIdx} className="text-xs bg-gray-800 p-2 rounded">
                          <div>{condition.name}</div>
                          <div className="text-gray-500 mt-1">
                            Y: {(condition.yesPrice * 100).toFixed(0)}¢ / N: {(condition.noPrice * 100).toFixed(0)}¢
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mapping Interface */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-3">Add Condition Mapping</h4>
            
            {/* Relationship Selection */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Relationship Type</label>
              <select
                value={selectedRelationship}
                onChange={(e) => setSelectedRelationship(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              >
                {relationshipTypes.map(rel => (
                  <option key={rel.value} value={rel.value}>{rel.label}</option>
                ))}
              </select>
            </div>

            {/* Condition Dropdowns */}
            <div className="grid" style={{ gridTemplateColumns: `repeat(${selectedEcosystem?.marketData.length || 1}, minmax(200px, 1fr))`, gap: '1rem' }}>
              {selectedEcosystem?.marketData.map((market, idx) => {
                const key = `${market.exchange}-${market.market}`;
                return (
                  <div key={idx}>
                    <label className="text-xs text-gray-400 mb-1 block">
                      {market.exchange} - {market.market}
                    </label>
                    <select
                      value={selectedConditions[key] || ''}
                      onChange={(e) => setSelectedConditions({
                        ...selectedConditions,
                        [key]: e.target.value
                      })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {market.conditions.map((condition, condIdx) => (
                        <option key={condIdx} value={condition.name}>
                          {condition.name} ({(condition.yesPrice * 100).toFixed(0)}¢)
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={addMapping}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Add Mapping
            </button>
          </div>

          {/* Current Mappings */}
          {mappings.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Current Mappings</h4>
              <div className="space-y-3">
                {mappings.map((mapping, idx) => (
                  <div key={idx} className="bg-gray-700 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-medium ${getRelationshipColor(mapping.relationship)}`}>
                        {relationshipTypes.find(r => r.value === mapping.relationship)?.label} Relationship
                      </div>
                      <button
                        onClick={() => removeMapping(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${Object.keys(mapping.conditions).length}, minmax(150px, 1fr))`, gap: '0.5rem' }}>
                      {Object.entries(mapping.conditions).map(([market, condition], condIdx) => (
                        <div key={condIdx} className="text-xs">
                          <div className="text-gray-400">{market}</div>
                          <div className="font-medium">{condition || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-2">
            <button 
              onClick={() => setShowConditionMatcher(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={saveConditionMappings}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              Save Mappings
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
