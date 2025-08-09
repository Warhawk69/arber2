import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, Edit2, CheckCircle, XCircle, X } from 'lucide-react';

const MatchedEcosystems = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState(null);

  // Mock data for ecosystem matching
  const [ecosystemData, setEcosystemData] = useState([
    {
      id: 1,
      name: 'Fed Rate Decision - September 2025',
      endTime: 'Sep 18, 2025',
      daysUntilClose: 42,
      exchanges: 4,
      markets: 6,
      conditions: 13,
      updated: '2 min ago',
      conditionsMatched: true,
      conditionMappings: [
        {
          conditions: {
            'Kalshi-Fed September Decision': '25 bps increase',
            'Polymarket-Federal Reserve Rate Decision': 'Rate increase',
            'Kalshi-Fed Hike by 50bps+': null,
            'ProphetX-FOMC September Outcome': null,
            'NoVig-Fed Rates Sep': 'Increase',
            'Polymarket-Fed Terminal Rate >5.5%': null
          },
          relationship: 'same'
        },
        {
          conditions: {
            'Kalshi-Fed September Decision': 'No change',
            'Polymarket-Federal Reserve Rate Decision': 'No change',
            'Kalshi-Fed Hike by 50bps+': null,
            'ProphetX-FOMC September Outcome': 'Neutral',
            'NoVig-Fed Rates Sep': null,
            'Polymarket-Fed Terminal Rate >5.5%': null
          },
          relationship: 'same'
        }
      ],
      marketData: [
        {
          exchange: 'Kalshi',
          market: 'Fed September Decision',
          conditions: [
            { name: '25 bps increase', yesPrice: 0.35, noPrice: 0.65 },
            { name: 'No change', yesPrice: 0.45, noPrice: 0.55 },
            { name: '25 bps decrease', yesPrice: 0.18, noPrice: 0.82 },
            { name: '50+ bps increase', yesPrice: 0.02, noPrice: 0.98 }
          ]
        },
        {
          exchange: 'Polymarket',
          market: 'Federal Reserve Rate Decision',
          conditions: [
            { name: 'Rate increase', yesPrice: 0.37, noPrice: 0.63 },
            { name: 'No change', yesPrice: 0.44, noPrice: 0.56 },
            { name: 'Rate decrease', yesPrice: 0.19, noPrice: 0.81 }
          ]
        },
        {
          exchange: 'Kalshi',
          market: 'Fed Hike by 50bps+',
          conditions: [
            { name: 'Yes', yesPrice: 0.02, noPrice: 0.98 },
            { name: 'No', yesPrice: 0.98, noPrice: 0.02 }
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
        },
        {
          exchange: 'Polymarket',
          market: 'Fed Terminal Rate >5.5%',
          conditions: [
            { name: 'Yes', yesPrice: 0.15, noPrice: 0.85 },
            { name: 'No', yesPrice: 0.85, noPrice: 0.15 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: '2028 Presidential Election',
      endTime: 'Nov 5, 2028',
      daysUntilClose: 1185,
      exchanges: 3,
      markets: 5,
      conditions: 21,
      updated: '5 min ago',
      conditionsMatched: false,
      conditionMappings: [],
      marketData: [
        {
          exchange: 'Kalshi',
          market: 'Presidential Election Winner 2028',
          conditions: [
            { name: 'JD Vance', yesPrice: 0.28, noPrice: 0.72 },
            { name: 'Gavin Newsom', yesPrice: 0.13, noPrice: 0.87 },
            { name: 'Alexandria Ocasio-Cortez', yesPrice: 0.09, noPrice: 0.91 },
            { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93 },
            { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94 },
            { name: 'Andy Beshear', yesPrice: 0.05, noPrice: 0.95 },
            { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96 }
          ]
        },
        {
          exchange: 'Polymarket',
          market: '2028 US Presidential Election',
          conditions: [
            { name: 'J.D. Vance', yesPrice: 0.27, noPrice: 0.73 },
            { name: 'Gavin Newsom', yesPrice: 0.14, noPrice: 0.86 },
            { name: 'AOC', yesPrice: 0.08, noPrice: 0.92 },
            { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93 },
            { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94 },
            { name: 'Andrew Beshear', yesPrice: 0.05, noPrice: 0.95 },
            { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96 }
          ]
        },
        {
          exchange: 'Kalshi',
          market: 'Republican Nominee 2028',
          conditions: [
            { name: 'JD Vance', yesPrice: 0.52, noPrice: 0.48 },
            { name: 'Marco Rubio', yesPrice: 0.15, noPrice: 0.85 },
            { name: 'Other', yesPrice: 0.33, noPrice: 0.67 }
          ]
        },
        {
          exchange: 'Kalshi',
          market: 'Democratic Nominee 2028',
          conditions: [
            { name: 'Gavin Newsom', yesPrice: 0.35, noPrice: 0.65 },
            { name: 'Gretchen Whitmer', yesPrice: 0.18, noPrice: 0.82 },
            { name: 'Other', yesPrice: 0.47, noPrice: 0.53 }
          ]
        },
        {
          exchange: 'Polymarket',
          market: 'Party to Win 2028',
          conditions: [
            { name: 'Republican', yesPrice: 0.48, noPrice: 0.52 },
            { name: 'Democrat', yesPrice: 0.52, noPrice: 0.48 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Bitcoin Price EOY 2025',
      endTime: 'Dec 31, 2025',
      daysUntilClose: 145,
      exchanges: 5,
      markets: 8,
      conditions: 15,
      updated: '8 min ago',
      conditionsMatched: true,
      conditionMappings: [
        {
          conditions: {
            'Kalshi-Bitcoin > $100k': 'Yes',
            'Polymarket-BTC above $100,000 by EOY': 'Yes',
            'Kalshi-Bitcoin > $150k': null,
            'Polymarket-BTC Price Range EOY': '$100k-$150k',
            'ProphetX-Bitcoin EOY Price': 'Above $100k',
            'NoVig-BTC 100k EOY': 'Yes',
            'Sporttrade-Bitcoin Year End': 'Over $100,000',
            'Kalshi-Bitcoin ATH in 2025': null
          },
          relationship: 'same'
        }
      ],
      marketData: [
        {
          exchange: 'Kalshi',
          market: 'Bitcoin > $100k',
          conditions: [
            { name: 'Yes', yesPrice: 0.40, noPrice: 0.60 },
            { name: 'No', yesPrice: 0.60, noPrice: 0.40 }
          ]
        },
        {
          exchange: 'Polymarket',
          market: 'BTC above $100,000 by EOY',
          conditions: [
            { name: 'Yes', yesPrice: 0.38, noPrice: 0.62 },
            { name: 'No', yesPrice: 0.62, noPrice: 0.38 }
          ]
        },
        {
          exchange: 'Kalshi',
          market: 'Bitcoin > $150k',
          conditions: [
            { name: 'Yes', yesPrice: 0.15, noPrice: 0.85 },
            { name: 'No', yesPrice: 0.85, noPrice: 0.15 }
          ]
        },
        {
          exchange: 'Polymarket',
          market: 'BTC Price Range EOY',
          conditions: [
            { name: '<$50k', yesPrice: 0.05, noPrice: 0.95 },
            { name: '$50k-$100k', yesPrice: 0.57, noPrice: 0.43 },
            { name: '$100k-$150k', yesPrice: 0.25, noPrice: 0.75 },
            { name: '>$150k', yesPrice: 0.13, noPrice: 0.87 }
          ]
        },
        {
          exchange: 'ProphetX',
          market: 'Bitcoin EOY Price',
          conditions: [
            { name: 'Above $100k', yesPrice: 0.39, noPrice: 0.61 }
          ]
        },
        {
          exchange: 'NoVig',
          market: 'BTC 100k EOY',
          conditions: [
            { name: 'Yes', yesPrice: 0.41, noPrice: 0.59 },
            { name: 'No', yesPrice: 0.59, noPrice: 0.41 }
          ]
        },
        {
          exchange: 'Sporttrade',
          market: 'Bitcoin Year End',
          conditions: [
            { name: 'Over $100,000', yesPrice: 0.37, noPrice: 0.63 }
          ]
        },
        {
          exchange: 'Kalshi',
          market: 'Bitcoin ATH in 2025',
          conditions: [
            { name: 'Yes', yesPrice: 0.78, noPrice: 0.22 },
            { name: 'No', yesPrice: 0.22, noPrice: 0.78 }
          ]
        }
      ]
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
    }, []);

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
      setEcosystemData(ecosystemData.map(ecosystem => 
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

  const filteredData = ecosystemData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleApproveEcosystem = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one market to create an ecosystem');
      return;
    }
    alert(`Creating ecosystem with ${selectedItems.length} markets`);
    setSelectedItems([]);
  };

  const ExpandedEcosystem = ({ item }) => (
    <tr>
      <td colSpan="10" className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-400">Market Conditions Across Exchanges</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-700">
                    <th className="text-left pb-2 pr-4">Condition</th>
                    {item.marketData.map((market, idx) => (
                      <th key={idx} className="text-center pb-2 px-4" colSpan="2">
                        <div className="font-semibold">{market.exchange}</div>
                        <div className="text-xs font-normal">{market.market}</div>
                      </th>
                    ))}
                  </tr>
                  <tr className="text-xs text-gray-500 border-b border-gray-700">
                    <th className="pb-2"></th>
                    {item.marketData.map((_, idx) => (
                      <React.Fragment key={idx}>
                        <th className="text-center pb-2 px-2">Yes</th>
                        <th className="text-center pb-2 px-2">No</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Get all unique conditions
                    const allConditions = new Set();
                    item.marketData.forEach(market => {
                      market.conditions.forEach(condition => {
                        allConditions.add(condition.name);
                      });
                    });
                    
                    return Array.from(allConditions).map((conditionName, idx) => (
                      <tr key={idx} className="text-sm border-t border-gray-700">
                        <td className="py-2 pr-4 font-medium">{conditionName}</td>
                        {item.marketData.map((market, marketIdx) => {
                          const condition = market.conditions.find(c => c.name === conditionName);
                          return (
                            <React.Fragment key={marketIdx}>
                              <td className="py-2 px-2 text-center">
                                {condition ? (
                                  <span className="text-green-400">{(condition.yesPrice * 100).toFixed(0)}¢</span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {condition ? (
                                  <span className="text-red-400">{(condition.noPrice * 100).toFixed(0)}¢</span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
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
            <h2 className="text-xl font-semibold">Matched Ecosystems</h2>
            <p className="text-sm text-gray-400 mt-1">View and manage matched markets across multiple exchanges</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search ecosystems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <button className="p-2 hover:bg-gray-800 rounded">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Selection Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-300">
              {selectedItems.length} ecosystem{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleApproveEcosystem}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
            >
              Approve Ecosystem
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded text-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredData.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                  />
                </th>
                <th className="p-3">Ecosystem Name</th>
                <th className="p-3">End Time</th>
                <th className="p-3">Days Until Close</th>
                <th className="p-3"># of Exchanges</th>
                <th className="p-3"># of Markets</th>
                <th className="p-3"># of Conditions</th>
                <th className="p-3">Conditions Matched</th>
                <th className="p-3">Updated</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    className={`border-t border-gray-800 hover:bg-gray-800 cursor-pointer ${
                      selectedItems.includes(item.id) ? 'bg-gray-800' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="rounded text-blue-500"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <div className="font-medium text-sm">{item.name}</div>
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-sm">{item.endTime}</span>
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-sm">{item.daysUntilClose} days</span>
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-sm font-medium">{item.exchanges}</span>
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-sm font-medium">{item.markets}</span>
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-sm font-medium">{item.conditions}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        {item.conditionsMatched ? (
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
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-xs text-gray-400">{item.updated}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEcosystem(item);
                            setShowConditionMatcher(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit condition mappings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-400 transform transition-transform ${
                            expandedRows.includes(item.id) ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </td>
                  </tr>
                  {expandedRows.includes(item.id) && <ExpandedEcosystem item={item} />}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showConditionMatcher && <EcosystemConditionMatcher />}
    </div>
  );
};

export default MatchedEcosystems;
