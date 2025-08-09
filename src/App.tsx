import React, { useState } from 'react';
import { MatchesProvider } from './state/matches-store';
import MarketMatcher from './market-matcher-component';
import EcosystemMatcher from './ecosystem-matcher-component';
import MatchedEcosystems from './matched-ecosystems-component';
import ArbitrageBets from './arbitrage-bets-component';

type ActiveView = 'market-matcher' | 'ecosystem-matcher' | 'matched-ecosystems' | 'arbitrage-bets';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('arbitrage-bets');

  const renderActiveView = () => {
    switch (activeView) {
      case 'market-matcher':
        return <MarketMatcher />;
      case 'ecosystem-matcher':
        return <EcosystemMatcher />;
      case 'matched-ecosystems':
        return <MatchedEcosystems />;
      case 'arbitrage-bets':
        return <ArbitrageBets />;
      default:
        return <ArbitrageBets />;
    }
  };

  return (
    <MatchesProvider>
      <div className="min-h-screen bg-gray-950">
        {/* Navigation */}
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="text-xl font-bold text-white">
                  🎯 Arbitrage Dashboard
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveView('arbitrage-bets')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeView === 'arbitrage-bets'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    🎯 Arbitrage Bets
                  </button>
                  <button
                    onClick={() => setActiveView('market-matcher')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeView === 'market-matcher'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    🔗 Market Matcher
                  </button>
                  <button
                    onClick={() => setActiveView('ecosystem-matcher')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeView === 'ecosystem-matcher'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    🌐 Ecosystem Matcher
                  </button>
                  <button
                    onClick={() => setActiveView('matched-ecosystems')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeView === 'matched-ecosystems'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    📊 Matched Ecosystems
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Live Prediction Market Arbitrage
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {renderActiveView()}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              Powered by Kalshi & Polymarket APIs • Real-time arbitrage detection
            </div>
            <div>
              {process.env.NODE_ENV === 'development' && 'Development Mode'}
            </div>
          </div>
        </footer>
      </div>
    </MatchesProvider>
  );
};

export default App;