import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, Edit2, CheckCircle, XCircle, X } from 'lucide-react';
import { useMatchStore } from './utils/matchStore';
import type { MatchedMarketPair } from './types';

const MatchedEcosystems = () => {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<MatchedMarketPair | null>(null);

  // Use the match store to get live data
  const { matches, updateMatch } = useMatchStore();

  // Transform matches into ecosystem format for display
  const ecosystemData = matches.map(match => {
    const daysUntilClose = Math.ceil(
      (new Date(match.earliestEndTime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      id: match.id,
      name: `${match.kalshi.title} / ${match.polymarket.title}`,
      endTime: new Date(match.earliestEndTime).toLocaleDateString(),
      daysUntilClose: Math.max(0, daysUntilClose),
      exchanges: 2, // Always Kalshi + Polymarket
      markets: 2, // Always a pair
      conditions: match.kalshi.conditions.length + match.polymarket.conditions.length,
      updated: new Date(match.createdAt).toLocaleDateString(),
      conditionsMatched: match.conditionsMatched,
      conditionMappings: match.conditionMappings,
      marketData: [
        {
          exchange: 'Kalshi',
          market: match.kalshi.title,
          conditions: match.kalshi.conditions
        },
        {
          exchange: 'Polymarket', 
          market: match.polymarket.title,
          conditions: match.polymarket.conditions
        }
      ],
      // Store original match for reference
      originalMatch: match
    };
  });

  const EcosystemConditionMatcher = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Match Ecosystem Conditions</h3>
            <button onClick={() => setShowConditionMatcher(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-400">
            <p>Condition matching functionality will be available in a future version.</p>
            <p className="text-sm mt-2">Use the Market Matcher to create condition mappings.</p>
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
      alert('Please select at least one market pair');
      return;
    }
    
    // In a real app, this would trigger some action
    alert(`Selected ${selectedItems.length} market pair(s) for ecosystem operations`);
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
        {/* No matches message */}
        {ecosystemData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No matched market pairs found.</p>
            <p className="text-sm text-gray-500 mt-2">
              Use the Market Matcher to create market pairs first.
            </p>
          </div>
        )}

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
