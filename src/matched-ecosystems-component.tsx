import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, Edit2, CheckCircle, XCircle, X } from 'lucide-react';
import { 
  getStore, 
  subscribeToStore, 
  updateEcosystemConditions 
} from './state/matches-store';
import { 
  Ecosystem, 
  ConditionMapping, 
  RelationshipType,
  CommonMarket 
} from './api/types';

const MatchedEcosystems = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<Ecosystem | null>(null);
  const [ecosystemData, setEcosystemData] = useState<Ecosystem[]>([]);

  // Subscribe to ecosystem data from store
  useEffect(() => {
    const updateEcosystemData = () => {
      const store = getStore();
      setEcosystemData(store.ecosystems);
    };

    updateEcosystemData();
    const unsubscribe = subscribeToStore(updateEcosystemData);
    return unsubscribe;
  }, []);

  const filteredData = ecosystemData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      alert('Please select at least one ecosystem');
      return;
    }
    alert(`Selected ${selectedItems.length} ecosystem${selectedItems.length > 1 ? 's' : ''}`);
    setSelectedItems([]);
  };

  const calculateDaysUntilClose = (ecosystem: Ecosystem): number => {
    if (!ecosystem.earliestEndTime) return 0;
    const now = new Date();
    const diffTime = ecosystem.earliestEndTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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

  const ExpandedEcosystem = ({ item }: { item: Ecosystem }) => (
    <tr>
      <td colSpan="10" className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-400">Market Overview</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.marketRefs.map((marketRef, idx) => (
                <div key={idx} className="bg-gray-700 rounded p-3">
                  <div className={`text-xs font-semibold mb-1 ${
                    marketRef.platform === 'kalshi' ? 'text-blue-400' : 
                    marketRef.platform === 'polymarket' ? 'text-purple-400' : 
                    'text-gray-400'
                  }`}>
                    {marketRef.platform === 'kalshi' ? 'Kalshi' : 'Polymarket'}
                  </div>
                  <div className="text-sm font-medium mb-2">
                    {marketRef.market?.title || marketRef.marketId}
                  </div>
                  {marketRef.market && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">
                        {marketRef.market.outcomes.length} conditions
                      </div>
                      <div className="text-xs text-gray-500">
                        Closes: {marketRef.market.closeTime.toLocaleDateString()}
                      </div>
                      {marketRef.market.outcomes.slice(0, 2).map((condition, condIdx) => (
                        <div key={condIdx} className="text-xs bg-gray-800 p-1 rounded">
                          {condition.name}: {(condition.yesPrice * 100).toFixed(0)}¢
                        </div>
                      ))}
                      {marketRef.market.outcomes.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{marketRef.market.outcomes.length - 2} more conditions
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {item.conditionMappings.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Condition Mappings</h4>
                <div className="text-xs text-gray-500">
                  {item.conditionMappings.length} mapping{item.conditionMappings.length > 1 ? 's' : ''} configured
                </div>
              </div>
            )}
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
                      <span className="text-sm">{item.earliestEndTime?.toLocaleDateString() || 'Not set'}</span>
                    </td>
                    <td className="p-3" onClick={() => toggleRowExpansion(item.id)}>
                      <span className="text-sm">{calculateDaysUntilClose(item)} days</span>
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
                      <span className="text-xs text-gray-400">{formatTimeAgo(item.createdAt)}</span>
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

      {showConditionMatcher && selectedEcosystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Edit Ecosystem Conditions</h3>
              <button onClick={() => setShowConditionMatcher(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">Condition mapping for "{selectedEcosystem.name}"</div>
              <div className="text-sm text-gray-500">
                This feature will allow editing condition mappings between markets in the ecosystem.
              </div>
              <button
                onClick={() => setShowConditionMatcher(false)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchedEcosystems;
