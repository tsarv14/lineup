# Sports API Suggestions for Games and Odds

## Recommended APIs (in order of recommendation)

### 1. **The Odds API** (the-odds-api.com)
- **Free Tier**: 500 requests/month
- **Paid Plans**: Starting at $10/month
- **Features**: 
  - Real-time odds from multiple sportsbooks
  - Game schedules and scores
  - Supports all major sports (NFL, NBA, MLB, NHL, etc.)
  - Easy integration with REST API
- **Best For**: Getting accurate, real-time odds to validate creator inputs
- **Setup**: Sign up at the-odds-api.com, get API key

### 2. **API-Sports** (api-sports.io)
- **Free Tier**: 100 requests/day
- **Paid Plans**: Starting at $9.99/month
- **Features**:
  - Comprehensive game data and schedules
  - Player statistics and rosters
  - Live scores
  - Supports 50+ sports
- **Best For**: Getting game schedules, teams, and player data
- **Setup**: Sign up at api-sports.io, get API key

### 3. **SportsDataIO** (sportsdata.io)
- **Free Tier**: Limited
- **Paid Plans**: Starting at $20/month
- **Features**:
  - Very comprehensive data
  - Official data feeds
  - Player props and advanced stats
- **Best For**: Professional-grade data (if budget allows)
- **Setup**: Sign up at sportsdata.io

### 4. **RapidAPI Sports APIs**
- Multiple sports APIs available
- Various pricing models
- **Examples**: 
  - API-Football (free tier available)
  - API-NBA (free tier available)
  - API-NFL (free tier available)
- **Best For**: Sport-specific needs
- **Setup**: Sign up at rapidapi.com, browse sports APIs

## Implementation Strategy

### For Odds Validation:
1. **Primary**: Use The Odds API to fetch current market odds
2. When creator selects a game and bet type, fetch available odds
3. Show suggested odds range
4. Validate entered odds against market (allow ±5% tolerance for line movement)
5. Flag if odds differ significantly (>10%) from market

### For Game Data:
1. **Primary**: Use API-Sports for game schedules and team data
2. Cache game data in database
3. Fetch games when sport/league selected
4. Auto-populate teams and players from API

### Environment Variables Needed:
```env
# The Odds API
ODDS_API_KEY=your_key_here

# API-Sports
API_SPORTS_KEY=your_key_here
API_SPORTS_BASE_URL=https://v1.american-football.api-sports.io

# Or use existing
SPORTS_API_PROVIDER=theoddsapi
SPORTS_API_KEY=your_key_here
SPORTS_API_BASE_URL=https://api.the-odds-api.com
```

## Odds Validation Approach

1. **Fetch Odds on Game Selection**: When creator selects a game, automatically fetch current odds for that game
2. **Show Suggested Odds**: Display a dropdown or suggestions based on API odds
3. **Auto-fill Option**: Allow creators to click "Use Market Odds" to auto-fill
4. **Validation on Submit**: 
   - Check if entered odds are within reasonable range of market odds
   - Allow ±5% tolerance for line movement
   - Warn if >10% difference (but still allow submission)
   - Block if >20% difference (likely error)

## Implementation Priority

1. **Phase 1**: Integrate The Odds API for odds fetching and validation
2. **Phase 2**: Integrate API-Sports for game schedules and team data
3. **Phase 3**: Add player roster fetching for props
4. **Phase 4**: Add real-time odds updates and alerts

