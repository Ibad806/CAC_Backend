import express from "express";

import Creategame from "../models/Creategame.js";

const router = express.Router();

router.post("/creategame", async (req, res) => {
    try {
       const newGame = new Creategame(req.body);
       console.log("Received Game:", newGame);
         await newGame.save();
            res.status(201).send({ message: "Game created successfully", game: newGame }); 

    } catch (error) {
        console.error('Error creating game:', error); 
        res.status(400).send({ message: 'Failed to create game', error: error.message });
    }
})

// GET all events
router.get('/creategame', async (req, res) => {
  try {
    const game = await Creategame.find().sort({ createdAt: -1 });
    res.status(200).send(game);
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch events', error: error.message });
  }
});

router.get('/creategame/:id', async (req, res) => {
  try {
    const game = await Event.findById(req.params.id);
    if (!game) return res.status(404).send({ message: 'game not found' });
    res.status(200).send(game);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching event', error: error.message });
  }
});

router.put('/creategame/:id', async (req, res) => {
  try {
    const updatedGame = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedGame) return res.status(404).send({ message: 'Game not found' });
    res.status(200).send({ message: 'Game updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(400).send({ message: 'Failed to update Game', error: error.message });
  }
});


router.delete('/creategame/:id', async (req, res) => {
  try {
    const deletedGame = await Event.findByIdAndDelete(req.params.id);
    if (!deletedGame) return res.status(404).send({ message: 'Game not found' });
    res.status(200).send({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Failed to delete Game', error: error.message });
  }
});

export default router;
