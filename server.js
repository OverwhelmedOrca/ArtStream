const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3000;
const jwtSecret = 'your_jwt_secret';
const fs = require('fs');

app.use(bodyParser.json());

app.use(cors({
  origin: '*', // Be cautious with this in production
  credentials: true
}));

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
    hostName: { type: String, required: true },
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String
    }],
    isLive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: false },
    streamKey: { type: String, unique: true },
    rtmpKey: { type: String },
    rtmpServer: { type: String },
    type: { type: String, enum: ['collaboration', 'battle'], default: 'battle' }
});

const Stream = mongoose.model('Stream', streamSchema, 'Streams');

const battleSchema = new mongoose.Schema({
  battleId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  arenaName: { type: String, required: true },
  stakeAmount: { type: Number, required: true },
  aiAllowed: { type: Boolean, required: true },
  liveStream: { type: Boolean, required: true },
  timeLimit: { type: Number, required: true },
  opponentFound: { type: Boolean, default: false },
  opponentName: { type: String, default: null },
  thetaStreamID: { type: String, default: null },
  opponentThetaStreamID: { type: String, default: null }, // New field
  createdAt: { type: Date, default: Date.now, expires: '1h' }
});

const Battle = mongoose.model('Battle', battleSchema, 'Battles');

// New schema for community posts
const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  content: { type: String, required: true },
  imagePath: { type: String },
  likes: [{ type: String }], // Array of usernames who liked the post
  comments: [{
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema, 'Community');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
    const { name, category, description, maxArtists, estimatedDuration, chatEnabled, hostName, isPrivate } = req.body;
    console.log('Received stream data:', req.body);
    
    try {
      const streamKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const stream = new Stream({
        name,
        category,
        description,
        maxArtists,
        estimatedDuration,
        chatEnabled,
        creator: req.user.userId,
        hostName,
        isPrivate,
        streamKey,
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

// Update the get streams route to include all streams
app.get('/streams', async (req, res) => {
    try {
        const streams = await Stream.find();
        res.json(streams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching streams' });
    }
});

// Add a route to join private streams
app.post('/join-private-stream', verifyToken, async (req, res) => {
  const { streamKey } = req.body;
  try {
      const stream = await Stream.findOne({ streamKey, isPrivate: true });
      if (!stream) {
          return res.status(404).json({ message: 'Stream not found or is not private' });
      }
      // Add logic to join the stream similar to the existing join route
      res.json({ stream });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error joining private stream' });
  }
});

// Add a route to update stream privacy
app.put('/streams/:id/privacy', verifyToken, async (req, res) => {
  const { isPrivate } = req.body;
  try {
      const stream = await Stream.findById(req.params.id);
      if (!stream) {
          return res.status(404).json({ message: 'Stream not found' });
      }
      if (stream.creator.toString() !== req.user.userId) {
          return res.status(403).json({ message: 'Not authorized' });
      }
      stream.isPrivate = isPrivate;
      await stream.save();
      res.json(stream);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error updating stream privacy' });
  }
});

// Add this new route to verify private streams
app.post('/verify-private-stream', verifyToken, async (req, res) => {
  const { streamKey } = req.body;
  try {
      const stream = await Stream.findOne({ streamKey });
      if (!stream) {
          return res.status(404).json({ message: 'Stream not found' });
      }
      // Return limited information about the stream
      res.json({
          stream: {
              _id: stream._id,
              name: stream.name,
              description: stream.description,
              currentArtists: stream.participants.length,
              maxArtists: stream.maxArtists,
              estimatedDuration: stream.estimatedDuration,
              isPrivate: stream.isPrivate
          }
      });
  } catch (err) {
      console.error('Error verifying private stream:', err);
      res.status(500).json({ message: 'Error verifying private stream' });
  }
});

// Update the get stream details route to include the streamKey for the creator
app.get('/streams/:id', verifyToken, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id).populate('creator', 'username');
        if (!stream) {
            return res.status(404).json({ message: 'Stream not found' });
        }
        const streamData = stream.toObject();
        // Only include the streamKey if the requester is the creator
        if (stream.creator._id.toString() === req.user.userId) {
            streamData.streamKey = stream.streamKey;
        }
        res.json(streamData);
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
    const { rtmpKey, rtmpServer, type } = req.body;
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (stream.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    stream.isLive = true;
    stream.rtmpKey = rtmpKey;
    stream.rtmpServer = rtmpServer;
    stream.type = type || 'battle'; // Set type to 'collaboration' if provided, otherwise default to 'battle'
    await stream.save();
    res.json(stream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error starting stream' });
  }
});

app.post('/api/find-opponent', verifyToken, async (req, res) => {
  const { username, arenaName, stakeAmount, aiAllowed, liveStream, timeLimit } = req.body;

  try {
    // Validate incoming data
    if (!username || !arenaName || stakeAmount === undefined || aiAllowed === undefined || liveStream === undefined || !timeLimit) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for an existing opponent
    let existingBattle = await Battle.findOne({
      arenaName,
      stakeAmount,
      aiAllowed,
      liveStream,
      timeLimit,
      opponentFound: false,
      username: { $ne: username }
    });

    if (existingBattle) {
      // Update the existing battle with the opponent's information
      existingBattle.opponentFound = true;
      existingBattle.opponentName = username;
      await existingBattle.save();

      return res.json({ 
        opponentFound: true, 
        opponent: { username: existingBattle.username },
        battleId: existingBattle.battleId
      });
    } else {
      // Create a new battle if no opponent is found
      const battleId = Math.random().toString(36).substr(2, 9);
      const newBattle = new Battle({
        battleId,
        username,
        arenaName,
        stakeAmount,
        aiAllowed,
        liveStream,
        timeLimit
      });
      await newBattle.save();

      return res.json({ opponentFound: false, battleId: newBattle.battleId });
    }
  } catch (err) {
    console.error('Error finding opponent:', err);
    res.status(500).json({ message: 'Error finding opponent', error: err.message });
  }
});

// New route to update thetaStreamID
app.put('/api/update-battle-stream/:battleId', verifyToken, async (req, res) => {
  const { battleId } = req.params;
  const { thetaStreamID } = req.body;

  try {
      const battle = await Battle.findOne({ battleId });

      if (!battle) {
          return res.status(404).json({ message: 'Battle not found' });
      }

      if (battle.username === req.user.username) {
          battle.thetaStreamID = thetaStreamID;
      } else if (battle.opponentName === req.user.username) {
          battle.opponentThetaStreamID = thetaStreamID;
      } else {
          return res.status(403).json({ message: 'User not authorized to update this battle' });
      }

      await battle.save();

      res.json({ message: 'Battle updated successfully', battle });
  } catch (err) {
      console.error('Error updating battle with stream ID:', err);
      res.status(500).json({ message: 'Error updating battle with stream ID', error: err.message });
  }
});

app.get('/api/check-opponent/:battleId', verifyToken, async (req, res) => {
  const { battleId } = req.params;

  try {
      const battle = await Battle.findOne({ battleId });

      if (!battle) {
          return res.status(404).json({ message: 'Battle not found' });
      }

      if (battle.opponentFound) {
          res.json({ 
              opponentFound: true, 
              opponent: { username: battle.opponentName } 
          });
      } else {
          res.json({ opponentFound: false });
      }
  } catch (err) {
      console.error('Error checking for opponent:', err);
      res.status(500).json({ message: 'Error checking for opponent' });
  }
});

app.get('/api/check-opponent', verifyToken, async (req, res) => {
  const username = req.user.username;

  try {
      const battle = await Battle.findOne({ username, opponentFound: true });

      if (battle) {
          res.json({ opponentFound: true, opponent: { username: battle.opponentName } });
      } else {
          res.json({ opponentFound: false });
      }
  } catch (err) {
      console.error('Error checking for opponent:', err);
      res.status(500).json({ message: 'Error checking for opponent' });
  }
});

// Serve static files from the public directory
app.use(express.static('public'));

// Create a new post
app.post('/api/posts', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const post = new Post({
      username: req.user.username,
      content,
      imagePath
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Like a post
app.post('/api/posts/:id/like', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userIndex = post.likes.indexOf(req.user.username);
    if (userIndex === -1) {
      post.likes.push(req.user.username);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Error liking post:', err);
    res.status(500).json({ message: 'Error liking post' });
  }
});

// Add a comment to a post
app.post('/api/posts/:id/comment', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      username: req.user.username,
      content
    });

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Error adding comment' });
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