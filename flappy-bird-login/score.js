const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { score } = req.body;
    const user = await User.findById(req.user.userId);
    if (score > user.highScore) {
      user.highScore = score;
      await user.save();
    }
    res.json({ highScore: user.highScore });
  } catch (error) {
    res.status(500).json({ error: 'Error updating score' });
  }
});

module.exports = router;