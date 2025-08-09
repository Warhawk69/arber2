import React, { useState } from 'react';
import { Search, RefreshCw, AlertCircle, Link, Check, X, Edit2, CheckCircle, XCircle } from 'lucide-react';

const MarketMatcher = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [filterVenue, setFilterVenue] = useState('all');
  const [searchTermKalshi, setSearchTermKalshi] = useState('');
  const [searchTermPoly, setSearchTermPoly] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState({ kalshi: null, polymarket: null });
  const [showRulesComparison, setShowRulesComparison] = useState(false);
  const [showConditionMatcher, setShowConditionMatcher] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data with multiple conditions
  const [unmatchedKalshiMarkets] = useState([
    {
      id: 'ELECTION-2028-WINNER',
      title: 'Presidential Election Winner 2028',
      category: 'Politics',
      volume: 6000000,
      liquidity: 450000,
      closeDate: '2028-11-05',
      settlementSource: 'Associated Press',
      rules: 'Market resolves to the candidate declared winner by the Associated Press',
      conditions: [
        { name: 'JD Vance', yesPrice: 0.28, noPrice: 0.72, volume: 501296 },
        { name: 'Gavin Newsom', yesPrice: 0.13, noPrice: 0.87, volume: 363835 },
        { name: 'Alexandria Ocasio-Cortez', yesPrice: 0.09, noPrice: 0.91, volume: 218268 },
        { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93, volume: 139748 },
        { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94, volume: 128925 },
        { name: 'Andy Beshear', yesPrice: 0.05, noPrice: 0.95, volume: 292807 },
        { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96, volume: 298604 }
      ]
    },
    {
      id: 'FED-SEPT-2025',
      title: 'Fed decision in September?',
      category: 'Economics',
      volume: 450000,
      liquidity: 120000,
      closeDate: '2025-09-18',
      settlementSource: 'Federal Reserve announcement',
      rules: 'Resolves based on Federal Reserve rate decision at September FOMC meeting',
      conditions: [
        { name: '25 bps decrease', yesPrice: 0.80, noPrice: 0.20, volume: 150000 },
        { name: 'No change', yesPrice: 0.15, noPrice: 0.85, volume: 180000 },
        { name: '25+ bps increase', yesPrice: 0.01, noPrice: 0.99, volume: 50000 }
      ]
    },
    {
      id: 'TRUMP-MEETING-AUG',
      title: 'Who will Trump meet with in August?',
      category: 'Politics',
      volume: 335000,
      liquidity: 85000,
      closeDate: '2025-08-31',
      settlementSource: 'White House press pool',
      rules: 'Resolves YES for each leader Trump meets with in August 2025',
      conditions: [
        { name: 'Vladimir Putin', yesPrice: 0.79, noPrice: 0.21, volume: 120000 },
        { name: 'Volodymyr Zelenskyy', yesPrice: 0.53, noPrice: 0.47, volume: 98000 },
        { name: 'Crown Prince Mohammed', yesPrice: 0.43, noPrice: 0.57, volume: 67000 }
      ]
    },
    {
      id: 'OPENAI-LIVESTREAM',
      title: 'What will be said during OpenAI livestream on August 7?',
      category: 'Technology',
      volume: 240000,
      liquidity: 65000,
      closeDate: '2025-08-07',
      settlementSource: 'OpenAI official livestream',
      rules: 'Resolves YES for each topic mentioned during the livestream',
      conditions: [
        { name: 'GPT 15+', yesPrice: 0.93, noPrice: 0.07, volume: 110000 },
        { name: 'OpenAI 5+', yesPrice: 0.75, noPrice: 0.25, volume: 85000 },
        { name: 'Multimodal', yesPrice: 0.84, noPrice: 0.16, volume: 45000 }
      ]
    }
  ]);

  const [unmatchedPolymarketMarkets] = useState([
    {
      id: '0x2028election',
      title: '2028 US Presidential Election',
      category: 'Politics',
      volume: 5200000,
      liquidity: 380000,
      closeDate: '2028-11-05',
      settlementSource: 'AP News',
      rules: 'Market resolves to the candidate declared winner by Associated Press',
      conditions: [
        { name: 'J.D. Vance', yesPrice: 0.27, noPrice: 0.73, volume: 480000 },
        { name: 'Gavin Newsom', yesPrice: 0.14, noPrice: 0.86, volume: 340000 },
        { name: 'AOC', yesPrice: 0.08, noPrice: 0.92, volume: 195000 },
        { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93, volume: 125000 },
        { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94, volume: 115000 },
        { name: 'Andrew Beshear', yesPrice: 0.05, noPrice: 0.95, volume: 270000 },
        { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96, volume: 280000 }
      ]
    },
    {
      id: '0xfedrate092025',
      title: 'Federal Reserve Rate Decision September 2025',
      category: 'Macro',
      volume: 420000,
      liquidity: 110000,
      closeDate: '2025-09-18',
      settlementSource: 'Fed official statement',
      rules: 'Resolves based on the Federal Reserve rate decision',
      conditions: [
        { name: 'Rate decrease', yesPrice: 0.78, noPrice: 0.22, volume: 140000 },
        { name: 'No change', yesPrice: 0.16, noPrice: 0.84, volume: 170000 },
        { name: 'Rate increase', yesPrice: 0.02, noPrice: 0.98, volume: 45000 }
      ]
    },
    {
      id: '0xtrumpmeetings',
      title: 'Trump August 2025 Meetings',
      category: 'Politics',
      volume: 310000,
      liquidity: 78000,
      closeDate: '2025-08-31',
      settlementSource: 'Official White House',
      rules: 'Resolves YES for confirmed meetings in August',
      conditions: [
        { name: 'Putin', yesPrice: 0.81, noPrice: 0.19, volume: 115000 },
        { name: 'Zelensky', yesPrice: 0.51, noPrice: 0.49, volume: 92000 },
        { name: 'MBS', yesPrice: 0.45, noPrice: 0.55, volume: 63000 }
      ]
    },
    {
      id: '0xopenaistream',
      title: 'OpenAI Aug 7 Announcements',
      category: 'Tech',
      volume: 225000,
      liquidity: 60000,
      closeDate: '2025-08-07',
      settlementSource: 'OpenAI stream',
      rules: 'YES if topic is announced during stream',
      conditions: [
        { name: 'GPT-15 or higher', yesPrice: 0.92, noPrice: 0.08, volume: 105000 },
        { name: 'OpenAI Five Plus', yesPrice: 0.76, noPrice: 0.24, volume: 80000 },
        { name: 'Multimodal AI', yesPrice: 0.85, noPrice: 0.15, volume: 40000 }
      ]
    }
  ]);

  const [matchHistory, setMatchHistory] = useState([
    {
      id: 1,
      kalshi: unmatchedKalshiMarkets[0],
      polymarket: unmatchedPolymarketMarkets[0],
      matchDate: '2025-08-05',
      confidence: 0.96,
      totalVolume: 11200000,
      conditionsMatched: true,
      conditionMappings: [
        { kalshi: 'JD Vance', polymarket: 'J.D. Vance', matched: true },
        { kalshi: 'Gavin Newsom', polymarket: 'Gavin Newsom', matched: true },
        { kalshi: 'Alexandria Ocasio-Cortez', polymarket: 'AOC', matched: true },
        { kalshi: 'Pete Buttigieg', polymarket: 'Pete Buttigieg', matched: true },
        { kalshi: 'Marco Rubio', polymarket: 'Marco Rubio', matched: true },
        { kalshi: 'Andy Beshear', polymarket: 'Andrew Beshear', matched: true },
        { kalshi: 'Gretchen Whitmer', polymarket: 'Gretchen Whitmer', matched: true }
      ]
    },
    {
      id: 2,
      kalshi: unmatchedKalshiMarkets[1],
      polymarket: unmatchedPolymarketMarkets[1],
      matchDate: '2025-08-04',
      confidence: 0.94,
      totalVolume: 870000,
      conditionsMatched: false,
      conditionMappings: [
        { kalshi: '25 bps decrease', polymarket: 'Rate decrease', matched: true },
        { kalshi: 'No change', polymarket: 'No change', matched: true },
        { kalshi: '25+ bps increase', polymarket: 'Rate increase', matched: true }
      ]
    }
  ]);

  // Auto-match suggestions
  const [autoMatchSuggestions] = useState([
    {
      kalshi: { id: 'SPXCLOSE-25AUG15', title: 'Will the S&P close higher on Aug 15?' },
      polymarket: { id: '0x1234...abcd', title: 'S&P 500 to close green on Aug 15 2025?' },
      similarity: 0.89,
      status: 'pending'
    },
    {
      kalshi: { id: 'FEDHIKE-25SEP', title: 'Fed to raise rates in September?' },
      polymarket: { id: '0x5678...efgh', title: 'Federal Reserve rate hike September 2025' },
      similarity: 0.92,
      status: 'pending'
    }
  ]);

  // Filter markets based on search
  const filteredKalshiMarkets = unmatchedKalshiMarkets.filter(market =>
    market.title.toLowerCase().includes(searchTermKalshi.toLowerCase()) ||
    market.id.toLowerCase().includes(searchTermKalshi.toLowerCase())
  );

  const filteredPolyMarkets = unmatchedPolymarketMarkets.filter(market =>
    market.title.toLowerCase().includes(searchTermPoly.toLowerCase()) ||
    market.id.toLowerCase().includes(searchTermPoly.toLowerCase())
  );

  // Calculate similarity score
  const calculateSimilarity = (market1, market2) => {
    if (!market1 || !market2) return null;
    
    // Title similarity
    const titleWords1 = market1.title.toLowerCase().split(' ');
    const titleWords2 = market2.title.toLowerCase().split(' ');
    const commonWords = titleWords1.filter(word => titleWords2.includes(word));
    const titleSimilarity = commonWords.length / Math.max(titleWords1.length, titleWords2.length);
    
    // Date similarity
    const dateSimilarity = market1.closeDate === market2.closeDate ? 1 : 0;
    
    // Condition count similarity
    const conditionCountDiff = Math.abs(market1.conditions.length - market2.conditions.length);
    const conditionSimilarity = 1 - (conditionCountDiff / Math.max(market1.conditions.length, market2.conditions.length));
    
    // Settlement source similarity
    const settlementSimilarity = market1.settlementSource.toLowerCase().includes('ap') && 
                                market2.settlementSource.toLowerCase().includes('ap') ? 1 : 
                                market1.settlementSource.toLowerCase() === market2.settlementSource.toLowerCase() ? 1 : 0.5;
    
    return {
      overall: (titleSimilarity * 0.4 + dateSimilarity * 0.3 + conditionSimilarity * 0.2 + settlementSimilarity * 0.1),
      title: titleSimilarity,
      date: dateSimilarity,
      conditions: conditionSimilarity,
      settlement: settlementSimilarity
    };
  };

  const similarity = calculateSimilarity(selectedMarkets.kalshi, selectedMarkets.polymarket);

  const handleApproveMatch = () => {
    if (!selectedMarkets.kalshi || !selectedMarkets.polymarket) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const newMatch = {
        id: Date.now(),
        kalshi: selectedMarkets.kalshi,
        polymarket: selectedMarkets.polymarket,
        matchDate: new Date().toISOString().split('T')[0],
        confidence: similarity.overall,
        totalVolume: selectedMarkets.kalshi.volume + selectedMarkets.polymarket.volume,
        conditionsMatched: false,
        conditionMappings: []
      };
      
      setMatchHistory([newMatch, ...matchHistory]);
      setSelectedMarkets({ kalshi: null, polymarket: null });
      setIsProcessing(false);
      
      // Show success message
      alert('Markets successfully matched! Please map conditions.');
    }, 1000);
  };

  const ConditionMatcher = () => {
    const [mappings, setMappings] = useState(
      selectedMatch?.conditionMappings || []
    );
    const [selectedKalshi, setSelectedKalshi] = useState('');
    const [selectedPoly, setSelectedPoly] = useState('');
    const [selectedRelationship, setSelectedRelationship] = useState('same');

    const relationshipTypes = [
      { value: 'same', label: 'Same', color: 'text-green-400' },
      { value: 'subset', label: 'Subset', color: 'text-blue-400' },
      { value: 'mutually-exclusive', label: 'Mutually Exclusive', color: 'text-orange-400' },
      { value: 'complementary', label: 'Complementary', color: 'text-purple-400' },
      { value: 'opposites', label: 'Opposites', color: 'text-red-400' },
      { value: 'overlapping', label: 'Overlapping', color: 'text-yellow-400' }
    ];

    const addMapping = () => {
      if (selectedKalshi && selectedPoly) {
        const newMapping = {
          kalshi: selectedKalshi,
          polymarket: selectedPoly,
          relationship: selectedRelationship,
          matched: true
        };
        setMappings([...mappings, newMapping]);
        setSelectedKalshi('');
        setSelectedPoly('');
        setSelectedRelationship('same');
      }
    };

    const removeMapping = (index) => {
      setMappings(mappings.filter((_, i) => i !== index));
    };

    const saveConditionMappings = () => {
      setMatchHistory(matchHistory.map(match => 
        match.id === selectedMatch.id
          ? { ...match, conditionMappings: mappings, conditionsMatched: mappings.length > 0 }
          : match
      ));
      setShowConditionMatcher(false);
      setSelectedMatch(null);
    };

    const getRelationshipColor = (relationship) => {
      const rel = relationshipTypes.find(r => r.value === relationship);
      return rel ? rel.color : 'text-gray-400';
    };

    // Get unmapped conditions
    const mappedKalshiConditions = mappings.map(m => m.kalshi);
    const mappedPolyConditions = mappings.map(m => m.polymarket);
    const unmappedKalshi = selectedMatch?.kalshi.conditions.filter(c => !mappedKalshiConditions.includes(c.name)) || [];
    const unmappedPoly = selectedMatch?.polymarket.conditions.filter(c => !mappedPolyConditions.includes(c.name)) || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Match Conditions</h3>
            <button onClick={() => setShowConditionMatcher(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-sm text-gray-400 mb-1">Matching conditions for:</div>
              <div className="font-medium">{selectedMatch?.kalshi.title}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Kalshi Conditions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-3">Kalshi Conditions</h4>
              <div className="space-y-2">
                {selectedMatch?.kalshi.conditions.map((condition, idx) => (
                  <div key={idx} className={`bg-gray-700 p-3 rounded ${mappedKalshiConditions.includes(condition.name) ? 'opacity-50' : ''}`}>
                    <div className="font-medium text-sm">{condition.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-400">
                        Y: {(condition.yesPrice * 100).toFixed(0)}¢ / N: {(condition.noPrice * 100).toFixed(0)}¢
                      </div>
                      <div className="text-xs text-gray-500">
                        Vol: ${(condition.volume / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Polymarket Conditions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-3">Polymarket Conditions</h4>
              <div className="space-y-2">
                {selectedMatch?.polymarket.conditions.map((condition, idx) => (
                  <div key={idx} className={`bg-gray-700 p-3 rounded ${mappedPolyConditions.includes(condition.name) ? 'opacity-50' : ''}`}>
                    <div className="font-medium text-sm">{condition.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-400">
                        Y: {(condition.yesPrice * 100).toFixed(0)}¢ / N: {(condition.noPrice * 100).toFixed(0)}¢
                      </div>
                      <div className="text-xs text-gray-500">
                        Vol: ${(condition.volume / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mapping Interface */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-3">Add Condition Mapping</h4>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Kalshi Condition</label>
                <select
                  value={selectedKalshi}
                  onChange={(e) => setSelectedKalshi(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select condition...</option>
                  {unmappedKalshi.map((condition, idx) => (
                    <option key={idx} value={condition.name}>
                      {condition.name} ({(condition.yesPrice * 100).toFixed(0)}¢)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Relationship</label>
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
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Polymarket Condition</label>
                <select
                  value={selectedPoly}
                  onChange={(e) => setSelectedPoly(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select condition...</option>
                  {unmappedPoly.map((condition, idx) => (
                    <option key={idx} value={condition.name}>
                      {condition.name} ({(condition.yesPrice * 100).toFixed(0)}¢)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={addMapping}
              disabled={!selectedKalshi || !selectedPoly}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Mapping
            </button>
          </div>

          {/* Current Mappings */}
          {mappings.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Current Mappings</h4>
              <div className="space-y-2">
                {mappings.map((mapping, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-1">
                        <div className="text-xs text-blue-400">Kalshi</div>
                        <div className="text-sm font-medium">{mapping.kalshi}</div>
                      </div>
                      <div className="px-3">
                        <div className="text-xs text-gray-400 text-center">Relationship</div>
                        <div className={`text-sm font-medium text-center ${getRelationshipColor(mapping.relationship)}`}>
                          {relationshipTypes.find(r => r.value === mapping.relationship)?.label}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-purple-400">Polymarket</div>
                        <div className="text-sm font-medium">{mapping.polymarket}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMapping(idx)}
                      className="ml-4 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
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

  const RulesComparison = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Rules & Settlement Comparison</h3>
          <button onClick={() => setShowRulesComparison(false)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {selectedMarkets.kalshi && selectedMarkets.polymarket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded">
                <h4 className="font-semibold text-blue-400 mb-2">Kalshi Market</h4>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Title</div>
                    <div className="text-sm text-gray-300">{selectedMarkets.kalshi.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Rules</div>
                    <p className="text-sm text-gray-300">{selectedMarkets.kalshi.rules}</p>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Settlement Source</div>
                    <div className="text-sm text-gray-300">{selectedMarkets.kalshi.settlementSource}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Conditions</div>
                    <div className="text-sm text-gray-300">{selectedMarkets.kalshi.conditions.length} outcomes</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded">
                <h4 className="font-semibold text-purple-400 mb-2">Polymarket Market</h4>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Title</div>
                    <div className="text-sm text-gray-300">{selectedMarkets.polymarket.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Rules</div>
                    <p className="text-sm text-gray-300">{selectedMarkets.polymarket.rules}</p>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Settlement Source</div>
                    <div className="text-sm text-gray-300">{selectedMarkets.polymarket.settlementSource}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Conditions</div>
                    <div className="text-sm text-gray-300">{selectedMarkets.polymarket.conditions.length} outcomes</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Condition Comparison */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Conditions Comparison</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-400 mb-2">Kalshi Conditions:</div>
                  <div className="space-y-1">
                    {selectedMarkets.kalshi.conditions.map((condition, idx) => (
                      <div key={idx} className="text-xs text-gray-300">
                        • {condition.name} (Y: {(condition.yesPrice * 100).toFixed(0)}¢)
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-purple-400 mb-2">Polymarket Conditions:</div>
                  <div className="space-y-1">
                    {selectedMarkets.polymarket.conditions.map((condition, idx) => (
                      <div key={idx} className="text-xs text-gray-300">
                        • {condition.name} (Y: {(condition.yesPrice * 100).toFixed(0)}¢)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {similarity && similarity.settlement < 1 && (
              <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded p-3">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-500">Settlement Source Difference Detected</div>
                    <div className="text-gray-400 mt-1">
                      These markets use different settlement sources which may lead to divergent outcomes. Please review carefully before matching.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={() => setShowRulesComparison(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Market Matcher</h2>
            <p className="text-sm text-gray-400 mt-1">Match markets across Kalshi and Polymarket for arbitrage opportunities</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded">
              <RefreshCw className="w-4 h-4" />
            </button>
            <select 
              value={filterVenue}
              onChange={(e) => setFilterVenue(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="politics">Politics</option>
              <option value="economics">Economics</option>
              <option value="technology">Technology</option>
              <option value="sports">Sports</option>
            </select>
          </div>
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
            onClick={() => setActiveTab('auto')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'auto' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400'
            }`}
          >
            Auto-Match Suggestions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === 'history' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400'
            }`}
          >
            Match History
          </button>
        </div>

        {/* Content */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
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
                      onClick={() => setSelectedMarkets(prev => ({ ...prev, kalshi: market }))}
                      className={`p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                        selectedMarkets.kalshi?.id === market.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{market.title}</div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          {market.category} • ${(market.volume / 1000).toFixed(0)}k vol • {market.conditions.length} conditions
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {market.conditions.slice(0, 3).map((condition, idx) => (
                            <span key={idx} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                              {condition.name}: {(condition.yesPrice * 100).toFixed(0)}¢
                            </span>
                          ))}
                          {market.conditions.length > 3 && (
                            <span className="text-xs text-gray-500">+{market.conditions.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Closes {market.closeDate}</div>
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
                      onClick={() => setSelectedMarkets(prev => ({ ...prev, polymarket: market }))}
                      className={`p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                        selectedMarkets.polymarket?.id === market.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{market.title}</div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          {market.category} • ${(market.volume / 1000).toFixed(0)}k vol • {market.conditions.length} conditions
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {market.conditions.slice(0, 3).map((condition, idx) => (
                            <span key={idx} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                              {condition.name}: {(condition.yesPrice * 100).toFixed(0)}¢
                            </span>
                          ))}
                          {market.conditions.length > 3 && (
                            <span className="text-xs text-gray-500">+{market.conditions.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Closes {market.closeDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Match Analysis */}
            {selectedMarkets.kalshi && selectedMarkets.polymarket && similarity && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Match Analysis</h3>
                
                {/* Selected Markets Summary */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="text-xs text-blue-400 mb-1">Kalshi Market</div>
                    <div className="text-sm font-medium">{selectedMarkets.kalshi.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedMarkets.kalshi.conditions.length} conditions</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded">
                    <div className="text-xs text-purple-400 mb-1">Polymarket Market</div>
                    <div className="text-sm font-medium">{selectedMarkets.polymarket.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedMarkets.polymarket.conditions.length} conditions</div>
                  </div>
                </div>
                
                {/* Similarity Scores */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Title Match</div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            similarity.title > 0.8 ? 'bg-green-500' : 
                            similarity.title > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${similarity.title * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(similarity.title * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Date Match</div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            similarity.date === 1 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${similarity.date * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(similarity.date * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Conditions</div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            similarity.conditions > 0.9 ? 'bg-green-500' : 
                            similarity.conditions > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${similarity.conditions * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(similarity.conditions * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Settlement</div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            similarity.settlement === 1 ? 'bg-green-500' : 
                            similarity.settlement > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${similarity.settlement * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(similarity.settlement * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Overall Score */}
                <div className="bg-gray-800 p-4 rounded mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Overall Match Score</div>
                      <div className={`text-3xl font-bold ${
                        similarity.overall > 0.9 ? 'text-green-400' : 
                        similarity.overall > 0.7 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {(similarity.overall * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${
                      similarity.overall > 0.9 ? 'bg-green-900 text-green-300' : 
                      similarity.overall > 0.7 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {similarity.overall > 0.9 ? 'High Confidence' : 
                       similarity.overall > 0.7 ? 'Medium Confidence' : 'Low Confidence'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowRulesComparison(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    <Link className="w-4 h-4 mr-1" />
                    Compare Full Details
                  </button>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedMarkets({ kalshi: null, polymarket: null })}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                    >
                      Reject Match
                    </button>
                    <button 
                      onClick={handleApproveMatch}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Approve Match
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'auto' && (
          <div className="space-y-4">
            {autoMatchSuggestions.map(market => (
              <div key={market.kalshi.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Kalshi Market</div>
                    <div className="text-white font-medium">{market.kalshi.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {market.kalshi.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Polymarket Market</div>
                    <div className="text-white font-medium">{market.polymarket.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {market.polymarket.id}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Similarity Score:</span>
                    <span className={`text-sm font-medium ${
                      market.similarity >= 0.95 ? 'text-green-400' : 
                      market.similarity >= 0.85 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {(market.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                      Reject
                    </button>
                    <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                      Approve Match
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                  <th className="p-3">Kalshi Market</th>
                  <th className="p-3">Polymarket Market</th>
                  <th className="p-3">Match Date</th>
                  <th className="p-3">Conditions</th>
                  <th className="p-3">Total Volume</th>
                  <th className="p-3">Conditions Matched</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map(match => (
                  <tr key={match.id} className="border-t border-gray-800 hover:bg-gray-800">
                    <td className="p-3">
                      <div className="text-sm font-medium">{match.kalshi.title}</div>
                      <div className="text-xs text-gray-500">{match.kalshi.id}</div>
                      <div className="text-xs text-gray-600 mt-1">{match.kalshi.conditions.length} conditions</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{match.polymarket.title}</div>
                      <div className="text-xs text-gray-500">{match.polymarket.id}</div>
                      <div className="text-xs text-gray-600 mt-1">{match.polymarket.conditions.length} conditions</div>
                    </td>
                    <td className="p-3 text-sm">
                      {match.matchDate}
                    </td>
                    <td className="p-3">
                      <select
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                        defaultValue={match.kalshi.conditions.length > 1 ? 'multi' : 'single'}
                      >
                        <option value="single">Single</option>
                        <option value="multi">Multi</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm">
                      ${(match.totalVolume / 1000).toFixed(0)}k
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        {match.conditionsMatched ? (
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
                            setSelectedMatch(match);
                            setShowConditionMatcher(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit condition mappings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-300 text-sm">
                          Unmatch
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRulesComparison && <RulesComparison />}
      {showConditionMatcher && <ConditionMatcher />}
    </div>
  );
};

export default MarketMatcher;
