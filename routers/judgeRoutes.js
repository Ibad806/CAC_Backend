import express from 'express';
import bcrypt from 'bcrypt';
import Judge from '../models/Judge.js';
import User from '../models/User.js';
import cors from "cors";
import Game from '../models/Creategame.js';

const router = express.Router();

router.use(cors());

// POST - Create new judge
router.post('/judges', async (req, res) => {
    try {
        const { name, email, contact, assignedGames } = req.body;

        // Check if judge exists
        const existingJudge = await Judge.findOne({ email });
        if (existingJudge) {
            return res.status(400).json({ message: 'Judge with this email already exists.' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Hash default password
        const hashedPassword = await bcrypt.hash('12345678', 10);

        // Create user
        const newUser = new User({
            name,
            email,
            role: 'judge',
            password: hashedPassword
        });
        await newUser.save();

        // Create judge
        const newJudge = new Judge({
            name,
            email,
            contact,
            assignedGames: assignedGames || [],
            user: newUser._id
        });
        await newJudge.save();

        res.status(201).json({ 
            message: 'Judge created successfully',
            judge: newJudge
        });

    } catch (error) {
        console.error('Error in judge creation:', error);
        res.status(500).json({ 
            message: 'Error creating judge',
            error: error.message 
        });
    }
});

// PUT - Update judge
router.put('/judges/:id', async (req, res) => {
    try {
        const { name, email, contact, assignedGames } = req.body;
        const judgeId = req.params.id;

        // Update judge
        const updatedJudge = await Judge.findByIdAndUpdate(
            judgeId,
            { 
                name, 
                email, 
                contact, 
                assignedGames: assignedGames || [] 
            },
            { new: true }
        );

        if (!updatedJudge) {
            return res.status(404).json({ success: false, message: 'Judge not found.' });
        }

        // Update corresponding user
        await User.findByIdAndUpdate(updatedJudge.user, {
            name,
            email
        });

        res.status(200).json({ 
            success: true, 
            message: 'Judge updated successfully.', 
            data: updatedJudge 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update judge.', 
            error: error.message 
        });
    }
});

// GET - All judges
router.get('/judges', async (req, res) => {
  try {
    const judges = await Judge.find({}).populate('user', 'name email');
    res.status(200).json(judges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching judges.', error: error.message });
  }
});

// GET - Single judge
router.get('/judges/:id', async (req, res) => {
    try {
        const judge = await Judge.findById(req.params.id);
        if (!judge) {
            return res.status(404).json({ message: 'Judge not found' });
        }
        res.status(200).json(judge);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching judge.', error: error.message });
    }
});

// DELETE - Remove judge
router.delete('/judges/:id', async (req, res) => {
    try {
        const judgeId = req.params.id;
        const judge = await Judge.findById(judgeId);
        
        if (!judge) {
            return res.status(404).json({ success: false, message: 'Judge not found.' });
        }

        // Delete corresponding user
        if (judge.user) {
            await User.findByIdAndDelete(judge.user);
        }
        
        // Delete judge
        await Judge.findByIdAndDelete(judgeId);

        res.status(200).json({ 
            success: true, 
            message: 'Judge and associated user deleted successfully.' 
        });
    } catch (error) {
        console.error('Error deleting judge:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete judge.', 
            error: error.message 
        });
    }
});

export default router;