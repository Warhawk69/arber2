import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, ChevronDown, Edit2, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { useLiveOrderbooks } from './hooks/useLiveOrderbooks';
import { useMatchesStore } from './state/matches-store';
import { CommonMarket } from './api/types';

const MatchedEcosystems = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Get ecosystem data with live market information
  const ecosystemsWithLiveData = useMemo(() => {
    return matchesStore.ecosystems.map(ecosystem => {
      const marketsData: Array<CommonMarket & { exchange: string }> = [];
      
      ecosystem.marketRefs.forEach(ref => {
        const market = ref.platform === 'kalshi' 
          ? kalshiMarkets.find(m => m.id === ref.marketId)
          : polymarketMarkets.find(m => m.id === ref.marketId);
        
        if (market) {
          marketsData.push({ ...market, exchange: ref.platform });
        }
      });

      const exchanges = new Set(marketsData.map(m => m.exchange)).size;
      const totalConditions = marketsData.reduce((sum, m) => sum + m.conditions.length, 0);
      const earliestEndTime = marketsData.length > 0 
        ? new Date(Math.min(...marketsData.map(m => m.closeTime.getTime())))
        : ecosystem.createdAt;

      const now = new Date();
      const daysUntilClose = Math.max(0, Math.ceil((earliestEndTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        ...ecosystem,
        marketsData,
        exchanges,
        markets: marketsData.length,
        conditions: totalConditions,
        earliestEndTime,
        daysUntilClose,
      };
    });
  }, [matchesStore.ecosystems, kalshiMarkets, polymarketMarkets]);

  const filteredData = useMemo(() => {
    return ecosystemsWithLiveData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ecosystemsWithLiveData, searchTerm]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleSelection = (id: string) => {
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

  const ExpandedEcosystem = ({ item }: { item: any }) => (
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
                    {item.marketsData.map((market: any, idx: number) => (
                      <th key={idx} className="text-center pb-2 px-4" colSpan={2}>
                        <div className="font-semibold">{market.exchange}</div>
                        <div className="text-xs font-normal">{market.title}</div>
                      </th>
                    ))}
                  </tr>
                  <tr className="text-xs text-gray-500 border-b border-gray-700">
                    <th className="pb-2"></th>
                    {item.marketsData.map((_: any, idx: number) => (
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
                    const allConditions = new Set<string>();
                    item.marketsData.forEach((market: any) => {
                      market.conditions.forEach((condition: any) => {
                        allConditions.add(condition.name);
                      });
                    });
                    
                    return Array.from(allConditions).map((conditionName, idx) => (
                      <tr key={idx} className="text-sm border-t border-gray-700">
                        <td className="py-2 pr-4 font-medium">{conditionName}</td>
                        {item.marketsData.map((market: any, marketIdx: number) => {
                          const condition = market.conditions.find((c: any) => c.name === conditionName);
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
            {lastUpdated && (
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()} • 
                {ecosystemsWithLiveData.length} ecosystems • 
                {ecosystemsWithLiveData.reduce((sum, e) => sum + e.markets, 0)} total markets
              </div>
            )}
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
            
            <button 
              onClick={refresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-800 rounded disabled:opacity-50"
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
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-red-500">API Errors:</div>
                {errors.slice(0, 2).map((error, idx) => (
                  <div key={idx} className="text-red-400 mt-1">{error.message}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Ecosystems Warning */}
        {ecosystemsWithLiveData.length === 0 && !isLoading && (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">No ecosystems created yet</div>
            <p className="text-sm text-gray-500">Use the Ecosystem Matcher to create your first multi-market ecosystem</p>
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
                      <span className="text-sm">{item.earliestEndTime.toLocaleDateString()}</span>
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
                      <span className="text-xs text-gray-400">
                        {lastUpdated ? (() => {
                          const diffMs = new Date().getTime() - lastUpdated.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
                        })() : 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Condition mapping for ecosystems coming soon');
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
