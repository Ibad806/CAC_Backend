import express from 'express';
import multer from 'multer';
import News from '../models/news.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/news';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create news
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const imagePath = req.file ? `/uploads/news/${req.file.filename}` : null;

    const newNews = new News({
      title,
      content,
      image: imagePath
    });

    await newNews.save();
    res.status(201).json(newNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all news
router.get('/', async (req, res) => {
  try {
    const newsList = await News.find().sort({ date: -1 });
    res.json(newsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update news
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/news/${req.file.filename}`;
      // Delete old image if exists
      const oldNews = await News.findById(id);
      if (oldNews.image) {
        const oldImagePath = `./${oldNews.image}`;
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, err => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
      }
    }

    const updatedNews = await News.findByIdAndUpdate(
      id,
      { 
        title, 
        content, 
        ...(imagePath && { image: imagePath }),
        date: Date.now()
      },
      { new: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.json(updatedNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete news
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndDelete(id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Delete associated image
    if (news.image) {
      const imagePath = `./${news.image}`;
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, err => {
          if (err) console.error('Error deleting image:', err);
        });
      }
    }

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;