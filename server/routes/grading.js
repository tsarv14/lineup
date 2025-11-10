const express = require('express');
const { runGradingJob, gradeGamePicks } = require('../jobs/grading');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// @route   POST /api/grading/run
// @desc    Manually trigger grading job (admin only)
// @access  Private (admin)
router.post('/run', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const summary = await runGradingJob(start, end);
    
    res.json({
      message: 'Grading job completed',
      summary
    });
  } catch (error) {
    console.error('Grading job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/grading/game/:gameId
// @desc    Grade picks for a specific game (admin only)
// @access  Private (admin)
router.post('/game/:gameId', auth, adminAuth, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const results = await gradeGamePicks(gameId);
    
    res.json({
      message: `Graded picks for game ${gameId}`,
      results
    });
  } catch (error) {
    console.error('Grade game picks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

