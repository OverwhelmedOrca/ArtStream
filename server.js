const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;
const jwtSecret = 'your_jwt_secret';

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb+srv://yashaggarwal3011:ShEt62UC0T176xru@greenglobe.gyrhabg.mongodb.net/?retryWrites=true&w=majority&appName=greenglobe')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema, 'PalettePals');

const streamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    maxArtists: { type: Number, required: true, min: 1 },
    estimatedDuration: { type: String, required: true },
    chatEnabled: { type: Boolean, default: true },
    currentArtists: { type: Number, default: 1 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostName: { type: String, required: true }, // Make sure this line is present
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String
    }],
    isLive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Stream = mongoose.model('Stream', streamSchema, 'Streams');

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.status(201).json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Access denied' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, jwtSecret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Create a new stream
app.post('/streams', verifyToken, async (req, res) => {
    const { name, category, description, maxArtists, estimatedDuration, chatEnabled, hostName } = req.body;
    console.log('Received stream data:', req.body);
    
    try {
      const stream = new Stream({
        name,
        category,
        description,
        maxArtists,
        estimatedDuration,
        chatEnabled,
        creator: req.user.userId,
        hostName,
        participants: [{ userId: req.user.userId, username: hostName }] // Add the creator as the first participant
      });
  
      const validationError = stream.validateSync();
      if (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ message: 'Invalid stream data', details: validationError.errors });
      }
  
      await stream.save();
      console.log('Saved stream:', stream);
      res.status(201).json(stream);
    } catch (err) {
      console.error('Error creating stream:', err);
      res.status(500).json({ message: 'Error creating stream', details: err.message });
    }
});

app.get('/streams', async (req, res) => {
    try {
        const streams = await Stream.find({ isLive: false }); // Fetch streams that are waiting to go live
        res.json(streams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching streams' });
    }
});


// Get stream details
app.get('/streams/:id', verifyToken, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id).populate('creator', 'username');
        if (!stream) {
            return res.status(404).json({ message: 'Stream not found' });
        }
        console.log('Retrieved stream:', stream);
        res.json(stream);
    } catch (err) {
        console.error('Error fetching stream data:', err);
        res.status(500).json({ message: 'Error fetching stream data' });
    }
});


// Join a stream
app.post('/streams/:id/join', verifyToken, async (req, res) => {
  try {
    console.log('Joining stream with ID:', req.params.id);
    console.log('User ID:', req.user.userId);
    console.log('Request body:', req.body);

    const stream = await Stream.findById(req.params.id).populate('creator', 'username');
    if (!stream) {
      console.log('Stream not found');
      return res.status(404).json({ message: 'Stream not found' });
    }
    console.log('Stream found:', stream);

    if (stream.participants.length >= stream.maxArtists) {
      console.log('Stream is full');
      return res.status(400).json({ message: 'Stream is full' });
    }

    const { username } = req.body;
    console.log('Username from request:', username);

    const participantIndex = stream.participants.findIndex(p => p.userId.toString() === req.user.userId);
    if (participantIndex === -1) {
      console.log('Adding new participant');
      stream.participants.push({ userId: req.user.userId, username });
      stream.currentArtists = stream.participants.length;
      await stream.save();
      console.log('Stream updated:', stream);
    } else {
      console.log('Participant already exists');
    }

    res.json({ stream, username });
  } catch (err) {
    console.error('Error joining stream:', err);
    res.status(500).json({ message: 'Error joining stream', error: err.message });
  }
});

// Start a stream (go live)
app.post('/streams/:id/start', verifyToken, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (stream.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    stream.isLive = true;
    await stream.save();
    res.json(stream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error starting stream' });
  }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});