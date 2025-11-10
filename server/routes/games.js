const express = require('express');
const Game = require('../models/Game');
const { searchGames, transformGameToCanonical } = require('../services/sportsApi');
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

module.exports = router;

