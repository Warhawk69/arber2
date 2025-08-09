import React, { useState } from 'react'
import MarketMatcher from './market-matcher-component'
import ArbitrageBets from './arbitrage-bets-component'
import EcosystemMatcher from './ecosystem-matcher-component'
import MatchedEcosystems from './matched-ecosystems-component'

function App() {
  const [activeComponent, setActiveComponent] = useState('market-matcher')

  const renderComponent = () => {
    switch (activeComponent) {
      case 'market-matcher':
        return <MarketMatcher />
      case 'arbitrage-bets':
        return <ArbitrageBets />
      case 'ecosystem-matcher':
        return <EcosystemMatcher />
      case 'matched-ecosystems':
        return <MatchedEcosystems />
      default:
        return <MarketMatcher />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-400">Arber2 🎯</h1>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveComponent('market-matcher')}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  activeComponent === 'market-matcher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Market Matcher
              </button>
              <button
                onClick={() => setActiveComponent('arbitrage-bets')}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  activeComponent === 'arbitrage-bets'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Arbitrage Bets
              </button>
              <button
                onClick={() => setActiveComponent('ecosystem-matcher')}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  activeComponent === 'ecosystem-matcher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Ecosystem Matcher
              </button>
              <button
                onClick={() => setActiveComponent('matched-ecosystems')}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  activeComponent === 'matched-ecosystems'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Matched Ecosystems
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {renderComponent()}
    </div>
  )
}

export default App