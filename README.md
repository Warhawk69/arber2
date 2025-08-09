# Arber2 - Prediction Market Arbitrage Platform

A React-based application for finding and executing arbitrage opportunities across prediction markets (Kalshi and Polymarket).

## Features

### 🎯 Live Data Integration
- **Real-time market data** from Polymarket and Kalshi APIs
- **Configurable polling intervals** (2.5s for Polymarket, 5s for Kalshi)
- **Intelligent caching** to reduce API calls
- **Orderbook snapshots** for precise bid/ask calculations

### 🤖 Smart Market Matching
- **Fuzzy similarity scoring** using title, date, category, and settlement source
- **Persistent storage** using localStorage-backed MatchStore
- **Manual approval workflow** with detailed similarity analysis
- **Condition mapping** with relationship types (same, subset, opposites, etc.)

### 💰 Arbitrage Calculation
- **Automated opportunity detection** from matched market pairs
- **Real-time profit calculations** based on live orderbook data
- **Risk assessment** with time-to-expiration and margin analysis
- **Daily return calculations** for performance comparison

### 🌐 Ecosystem Management
- **Multi-market ecosystems** across exchanges
- **Cross-platform condition matching**
- **Unified data view** for complex arbitrage strategies

## Components

### 1. Market Matcher (`/market-matcher`)
- Browse live markets from Kalshi and Polymarket
- Apply fuzzy matching to find similar markets
- Create and approve market pairs
- Map conditions between exchanges

### 2. Arbitrage Bets (`/arbitrage-bets`)
- View computed arbitrage opportunities
- See profit margins and risk assessments
- Expand details to view condition prices
- Real-time updates every 30 seconds

### 3. Ecosystem Matcher (`/ecosystem-matcher`)
- Create multi-market ecosystems
- Select markets across multiple exchanges
- Manage complex arbitrage strategies

### 4. Matched Ecosystems (`/matched-ecosystems`)
- View all matched market pairs
- Monitor condition mapping status
- Track ecosystem performance

## Technical Architecture

### Data Layer (`src/api/`)
- **`polymarket.ts`** - Polymarket API integration
- **`kalshi.ts`** - Kalshi API integration  
- **`polling.ts`** - Real-time data polling hooks

### Business Logic (`src/utils/`)
- **`matching.ts`** - Fuzzy market similarity scoring
- **`arbitrage.ts`** - Arbitrage opportunity calculation
- **`matchStore.ts`** - Persistent match storage

### Types (`src/types.ts`)
- Comprehensive TypeScript definitions
- Market, Condition, OrderbookSnapshot interfaces
- API response and arbitrage opportunity types

## Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Warhawk69/arber2.git
cd arber2

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Start with Market Matcher**: Browse and match similar markets between Kalshi and Polymarket
2. **Map Conditions**: Define relationships between market conditions (same, subset, opposites, etc.)
3. **View Arbitrage Opportunities**: Check the Arbitrage Bets tab for calculated profit opportunities
4. **Monitor Performance**: Use Matched Ecosystems to track your market pairs

## API Integration

Currently configured with mock data that simulates real API responses. To use live data:

1. **Polymarket**: Update `POLYMARKET_API_BASE` in `src/api/polymarket.ts`
2. **Kalshi**: Update `KALSHI_API_BASE` in `src/api/kalshi.ts`
3. **Authentication**: Add API keys as needed for each platform

## Arbitrage Logic

The system calculates arbitrage opportunities using this logic:

```typescript
// For condition mappings with relationship === 'same'
const minYesAsk = Math.min(kalshiYesAsk, polyYesAsk)
const minNoAsk = Math.min(kalshiNoAsk, polyNoAsk)
const totalCost = minYesAsk + minNoAsk

// Arbitrage exists when totalCost < 1.0
if (totalCost < 1.0) {
  const profit = 1.0 - totalCost
  const rPeriod = profit / totalCost
  const dailyReturn = rPeriod / daysUntilClose
}
```

## Configuration

Polling intervals can be adjusted in `src/api/polling.ts`:

```typescript
const DEFAULT_CONFIG = {
  polymarketInterval: 2500, // 2.5 seconds
  kalshiInterval: 5000,     // 5 seconds
  enabled: true
}
```

## Development

The application uses:
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Lucide React** for icons

## License

MIT License - see LICENSE file for details