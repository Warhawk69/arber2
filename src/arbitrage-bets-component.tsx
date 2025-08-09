import React, { useState, useEffect } from 'react';
import { Circle, Square, Search, Settings, RefreshCw, ChevronDown } from 'lucide-react';

const ArbitrageBets = () => {
  const [activeTab, setActiveTab] = useState('pre-match');
  const [searchTerm, setSearchTerm] = useState('');
  const [arbitrageData, setArbitrageData] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  // Mock data for demonstration with conditions
  const mockArbitrageData = [
    {
      id: 1,
      percentage: 1.64,
      event: 'Toronto Blue Jays vs Cleveland Guardians',
      eventType: 'Baseball | MLB',
      market: '1st inning Total Runs',
      startTime: '7:10 PM',
      bets: [
        { outcome: 'Over 0.5', venue: 'NoVig', odds: '+125', stake: 100, payout: 225 },
        { outcome: 'Under 0.5', venue: 'Sporttrade', odds: '-117', stake: 117, payout: 217 }
      ],
      profit: 8,
      totalStake: 217,
      updated: '2 min ago',
      kalshiConditions: [
        { name: 'Over 0.5', yesPrice: 0.44, noPrice: 0.56 },
        { name: 'Under 0.5', yesPrice: 0.54, noPrice: 0.46 }
      ],
      polymarketConditions: [
        { name: 'Over 0.5 runs', yesPrice: 0.42, noPrice: 0.58 },
        { name: 'Under 0.5 runs', yesPrice: 0.56, noPrice: 0.44 }
      ]
    },
    {
      id: 2,
      percentage: 1.6,
      event: 'Atlanta Braves vs Pittsburgh Pirates',
      eventType: 'Baseball | MLB',
      market: 'Total Runs',
      startTime: '8:39 PM',
      bets: [
        { outcome: 'Over 8.5', venue: 'ProphetX', odds: '-108', stake: 108, payout: 208 },
        { outcome: 'Under 8.5', venue: 'NoVig', odds: '+113', stake: 100, payout: 213 }
      ],
      profit: 5,
      totalStake: 208,
      updated: '5 min ago',
      kalshiConditions: [
        { name: 'Over 8.5', yesPrice: 0.52, noPrice: 0.48 },
        { name: 'Under 8.5', yesPrice: 0.47, noPrice: 0.53 }
      ],
      polymarketConditions: [
        { name: 'Over 8.5 total', yesPrice: 0.50, noPrice: 0.50 },
        { name: 'Under 8.5 total', yesPrice: 0.49, noPrice: 0.51 }
      ]
    },
    {
      id: 3,
      percentage: 1.35,
      event: 'Atlanta Braves vs Pittsburgh Pirates',
      eventType: 'Baseball | MLB',
      market: '1st Half Total Runs',
      startTime: '8:30 PM',
      bets: [
        { outcome: 'Over 7.5', venue: 'Kalshi', odds: '-235', stake: 235, payout: 335 },
        { outcome: 'Under 7.5', venue: 'Polymarket', odds: '+240', stake: 100, payout: 340 }
      ],
      profit: 5,
      totalStake: 335,
      updated: '8 min ago',
      kalshiConditions: [
        { name: 'Over 7.5', yesPrice: 0.70, noPrice: 0.30 },
        { name: 'Under 7.5', yesPrice: 0.29, noPrice: 0.71 }
      ],
      polymarketConditions: [
        { name: 'Over 7.5 runs', yesPrice: 0.68, noPrice: 0.32 },
        { name: 'Under 7.5 runs', yesPrice: 0.31, noPrice: 0.69 }
      ]
    },
    {
      id: 4,
      percentage: 2.1,
      event: 'Fed Rate Decision - September 2025',
      eventType: 'Politics | Economics',
      market: 'Will Fed raise rates?',
      startTime: 'Sep 18',
      bets: [
        { outcome: 'Yes', venue: 'Kalshi', odds: '+180', stake: 100, payout: 280 },
        { outcome: 'No', venue: 'Polymarket', odds: '-165', stake: 165, payout: 265 }
      ],
      profit: 15,
      totalStake: 265,
      updated: '12 min ago',
      kalshiConditions: [
        { name: '25 bps increase', yesPrice: 0.35, noPrice: 0.65 },
        { name: 'No change', yesPrice: 0.45, noPrice: 0.55 },
        { name: '25 bps decrease', yesPrice: 0.18, noPrice: 0.82 },
        { name: '50+ bps increase', yesPrice: 0.02, noPrice: 0.98 }
      ],
      polymarketConditions: [
        { name: 'Rate increase', yesPrice: 0.37, noPrice: 0.63 },
        { name: 'No change', yesPrice: 0.44, noPrice: 0.56 },
        { name: 'Rate decrease', yesPrice: 0.19, noPrice: 0.81 }
      ]
    },
    {
      id: 5,
      percentage: 1.8,
      event: 'Bitcoin above $100k by EOY',
      eventType: 'Crypto | Finance',
      market: 'Bitcoin > $100,000',
      startTime: 'Dec 31',
      bets: [
        { outcome: 'Yes', venue: 'Polymarket', odds: '+145', stake: 100, payout: 245 },
        { outcome: 'No', venue: 'Kalshi', odds: '-135', stake: 135, payout: 235 }
      ],
      profit: 10,
      totalStake: 235,
      updated: '15 min ago',
      kalshiConditions: [
        { name: 'Yes', yesPrice: 0.40, noPrice: 0.60 },
        { name: 'No', yesPrice: 0.60, noPrice: 0.40 }
      ],
      polymarketConditions: [
        { name: 'Yes', yesPrice: 0.38, noPrice: 0.62 },
        { name: 'No', yesPrice: 0.62, noPrice: 0.38 }
      ]
    }
  ];

  useEffect(() => {
    setArbitrageData(mockArbitrageData);
  }, []);

  const filteredData = arbitrageData.filter(item =>
    item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const ExpandedConditions = ({ item }) => (
    <tr>
      <td colSpan="10" className="p-0">
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Kalshi Conditions */}
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Kalshi Conditions</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.kalshiConditions.map((condition, idx) => (
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
                <h4 className="text-sm font-semibold text-purple-400 mb-3">Polymarket Conditions</h4>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-700">
                      <th className="text-left pb-2">Condition</th>
                      <th className="text-right pb-2">Yes Price</th>
                      <th className="text-right pb-2">No Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.polymarketConditions.map((condition, idx) => (
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
          <span className="text-sm text-gray-300">
            Click here to learn more about how to set up notifications for arbitrage bets
          </span>
          <button className="text-blue-400 text-sm hover:text-blue-300">Learn more →</button>
        </div>

        {/* Tabs - Only Pre-match now */}
        <div className="flex space-x-1 mb-4">
          <button
            className="px-4 py-2 rounded-t-lg text-sm font-medium bg-gray-800 text-white"
          >
            Pre-match <span className="ml-1 text-xs bg-gray-700 px-2 py-1 rounded">{filteredData.length}</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-left text-xs uppercase text-gray-400">
                <th className="p-3">Percent ↓</th>
                <th className="p-3">Event Name</th>
                <th className="p-3">Start Time</th>
                <th className="p-3">Market</th>
                <th className="p-3">Bets</th>
                <th className="p-3">Odds</th>
                <th className="p-3">Stake</th>
                <th className="p-3">Profit</th>
                <th className="p-3">Updated</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    className="border-t border-gray-800 hover:bg-gray-800 cursor-pointer"
                    onClick={() => toggleRowExpansion(item.id)}
                  >
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Square className="w-4 h-4 text-gray-600" />
                        <Circle className="w-4 h-4 text-blue-500" />
                        <span className="text-green-400 font-medium">{item.percentage}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{item.event}</div>
                      <div className="text-xs text-gray-500">{item.eventType}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm">{item.startTime}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{item.market}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {item.bets.map((bet, i) => (
                          <div key={i} className="text-sm">
                            {i === 0 ? (
                              <span className="text-green-400">{bet.outcome}</span>
                            ) : (
                              <span className="text-red-400">{bet.outcome}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {item.bets.map((bet, i) => (
                          <div key={i} className="flex items-center space-x-2 text-sm">
                            <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                              {bet.venue}
                            </span>
                            <span className="font-medium">{bet.odds}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">${item.totalStake}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-green-400 font-medium">+${item.profit}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-gray-400">{item.updated}</span>
                    </td>
                    <td className="p-3">
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-400 transform transition-transform ${
                          expandedRows.includes(item.id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </td>
                  </tr>
                  {expandedRows.includes(item.id) && <ExpandedConditions item={item} />}
                </React.Fragment>
              ))}
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
