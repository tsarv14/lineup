const express = require('express');
const Game = require('../models/Game');
const { searchGames, transformGameToCanonical, getGameOdds, getGameTeams, getGamePlayers } = require('../services/sportsApi');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/games
// @desc    Search for games by sport, league, and date range
// @access  Public (or Private if you want to restrict)
router.get('/', async (req, res) => {
  try {
    const { sport, league, startDate, endDate, limit = 50 } = req.query;
    
    // If API is configured, try to fetch from API first
    let games = [];
    if (sport && startDate) {
      try {
        const apiGames = await searchGames({ sport, league, startDate, endDate });
        games = apiGames;
        
        // Store games in database for caching
        for (const apiGame of apiGames) {
          try {
            await Game.findOneAndUpdate(
              { gameId: apiGame.gameId },
              apiGame,
              { upsert: true, new: true }
            );
          } catch (err) {
            console.error('Error storing game:', err);
          }
        }
      } catch (apiError) {
        console.log('API fetch failed, using database:', apiError.message);
      }
    }
    
    // If no API results, query database
    if (games.length === 0) {
      const query = {};
      if (sport) query.sport = sport;
      if (league) query.league = league;
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }
      
      const dbGames = await Game.find(query)
        .sort({ startTime: 1 })
        .limit(parseInt(limit));
      
      games = dbGames;
    }
    
    res.json(games);
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/games/leagues/:sport
// @desc    Get available leagues for a sport
// @access  Public
router.get('/leagues/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    
    // Common leagues by sport
    const leaguesBySport = {
      'Football': ['NFL', 'CFB', 'XFL', 'USFL'],
      'College Football': ['CFB', 'FBS', 'FCS'],
      'Basketball': ['NBA', 'NCAA', 'WNBA', 'G League'],
      'Baseball': ['MLB', 'MiLB', 'NPB'],
      'Hockey': ['NHL', 'AHL', 'NCAA'],
      'Soccer': ['MLS', 'EPL', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'World Cup'],
      'Tennis': ['ATP', 'WTA', 'Grand Slam'],
      'Golf': ['PGA', 'LPGA', 'European Tour', 'Masters', 'US Open', 'PGA Championship', 'Open Championship'],
      'MMA': ['UFC', 'Bellator', 'ONE Championship'],
      'Boxing': ['Professional', 'Amateur'],
      'Racing': ['NASCAR', 'F1', 'IndyCar', 'MotoGP']
    };
    
    const leagues = leaguesBySport[sport] || [];
    
    res.json(leagues);
  } catch (error) {
    console.error('Get leagues error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/games/:gameId
// @desc    Get game details by gameId
// @access  Public
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    let game = await Game.findOne({ gameId });
    
    // If not in database and API is configured, try to fetch
    if (!game && process.env.SPORTS_API_KEY) {
      try {
        const { getGameById } = require('../services/sportsApi');
        const apiGame = await getGameById(gameId);
        if (apiGame) {
          game = await Game.findOneAndUpdate(
            { gameId },
            apiGame,
            { upsert: true, new: true }
          );
        }
      } catch (apiError) {
        console.log('API fetch failed:', apiError.message);
      }
    }
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/games/:gameId/odds
// @desc    Get odds for a specific game and bet type
// @access  Public
router.get('/:gameId/odds', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { betType } = req.query; // moneyline, spread, total, prop
    
    const odds = await getGameOdds(gameId, betType);
    
    res.json(odds);
  } catch (error) {
    console.error('Get game odds error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/games/:gameId/teams
// @desc    Get teams for a specific game
// @access  Public
router.get('/:gameId/teams', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const teams = await getGameTeams(gameId);
    
    res.json(teams);
  } catch (error) {
    console.error('Get game teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/games/:gameId/players
// @desc    Get players for a specific game (for props)
// @access  Public
router.get('/:gameId/players', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const players = await getGamePlayers(gameId);
    
    res.json(players);
  } catch (error) {
    console.error('Get game players error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
