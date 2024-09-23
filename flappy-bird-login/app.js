const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/score');

const app = express();

mongoose.connect('mongodb://localhost/flappybird', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use(express.static('public'));

app.use('/auth', authRoutes);
app.use('/score', scoreRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));