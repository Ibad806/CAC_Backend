import express from 'express';
import Judge from '../models/Judge.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to authenticate judge
const authenticateJudge = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    const judge = await Judge.findOne({ email: decoded.email })
      .populate('assignedGames.game');
    
    if (!judge) {
      return res.status(404).json({ message: 'Judge not found' });
    }

    req.judge = judge;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get assigned games
router.get('/assigned-games', authenticateJudge, async (req, res) => {
  try {
    const judge = req.judge;
    res.status(200).json({
      success: true,
      games: judge.assignedGames
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch games',
      error: error.message 
    });
  }
});

// Announce game result
router.post('/announce-result/:gameId', authenticateJudge, async (req, res) => {
  try {
    const { winner, runnerUp } = req.body;
    const gameId = req.params.gameId;
    const judge = req.judge;

    // Find the game assignment
    const gameAssignment = judge.assignedGames.find(
      assignment => assignment.game._id.toString() === gameId
    );

    if (!gameAssignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game not assigned to this judge' 
      });
    }

    // Update the result
    gameAssignment.status = "completed";
    gameAssignment.result = {
      winner,
      runnerUp,
      announcedAt: new Date()
    };

    await judge.save();

    res.status(200).json({ 
      success: true, 
      message: 'Result announced successfully',
      game: gameAssignment
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to announce result',
      error: error.message 
    });
  }
});

export default router;