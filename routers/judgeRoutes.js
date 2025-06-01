// routes/judgeRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';

import Judge from '../models/Judge.js';
import User from '../models/User.js';
import cors from "cors";
import Game from '../models/Creategame.js'; // Renamed for clarity

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

        // Hash password
        const hashedPassword = await bcrypt.hash('123456', 10);

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
            assignedGames: assignedGames?.length > 0 ? [assignedGames[0]] : [],
            user: newUser._id
        });
        await newJudge.save();

        // Send email notification
        let gameTitle = 'No game assigned';
        if (assignedGames?.length > 0) {
            const game = await Game.findById(assignedGames[0]);
            gameTitle = game?.title || 'the assigned game';
        }


        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Judge Assignment Notification',
            text: `Dear ${name},\n\nYou have been assigned as a judge for: ${gameTitle}\n\nYour default password is: 123456\nPlease log in first and then change your password.\n Go to https://co-curriculum-activities-cs-it.vercel.app/judgespanel/profile\n\nBest regards,\nAdmin`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", email);

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

        // Validate single game assignment
        if (assignedGames.length > 1) {
            return res.status(400).json({ success: false, message: 'A judge can only be assigned to one game.' });
        }

        // Update judge
        const updatedJudge = await Judge.findByIdAndUpdate(
            req.params.id,
            { 
                name, 
                email, 
                contact, 
                assignedGames: assignedGames.length > 0 ? [assignedGames[0]] : [] 
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
        const judges = await Judge.find({});
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
        const judge = await Judge.findById(req.params.id);
        
        if (!judge) {
            return res.status(404).json({ success: false, message: 'Judge not found.' });
        }

        // Delete corresponding user
        await User.findByIdAndDelete(judge.user);
        
        // Delete judge
        await Judge.findByIdAndDelete(req.params.id);

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