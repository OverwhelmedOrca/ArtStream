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

// Define the verifyToken middleware
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
      username: String,
      thetaID: String,
      rtmpKey: String,
      rtmpServer: String
  }],
    isLive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: false },
    streamKey: { type: String, unique: true },
    rtmpKey: { type: String },
    rtmpServer: { type: String },
    type: { type: String, enum: ['collaboration', 'battle'], default: 'battle' },
    thetaID: { type: String, default: null }
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
  opponentThetaStreamID: { type: String, default: null },
  votes: { type: Number, default: 0 },
  votedBy: [{ type: String }],
  opponentVotes: { type: Number, default: 0 },
  opponentVotedBy: [{ type: String }],
  prompt: { type: String, default: 'Abstract emotions' },
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

// Verify token route
app.get('/verify-token', verifyToken, (req, res) => {
  res.json({ username: req.user.username });
});

// Login route
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
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

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
        participants: [{ userId: req.user.userId, username: hostName }],
        thetaID: null // Initialize thetaID as null
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

// Add a new route to update the thetaID
app.put('/streams/:id/update-theta-id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { thetaID } = req.body;

  try {
      const stream = await Stream.findById(id);
      if (!stream) {
          return res.status(404).json({ message: 'Stream not found' });
      }

      stream.thetaID = thetaID;
      await stream.save();

      res.json({ message: 'ThetaID updated successfully', stream });
  } catch (err) {
      console.error('Error updating thetaID:', err);
      res.status(500).json({ message: 'Error updating thetaID', error: err.message });
  }
});

// Add this new route to server.js
app.get('/streams/by-theta-id/:thetaId', verifyToken, async (req, res) => {
  try {
      const stream = await Stream.findOne({ thetaID: req.params.thetaId });
      if (!stream) {
          return res.status(404).json({ message: 'Stream not found' });
      }
      res.json(stream);
  } catch (err) {
      console.error('Error fetching stream by thetaID:', err);
      res.status(500).json({ message: 'Error fetching stream', error: err.message });
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

app.get('/join-streams', async (req, res) => {
  try {
      const streams = await Stream.find({isLive: false, isPrivate: false});
      res.json(streams);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching streams' });
  }
});

app.get('/streams/:id/status', verifyToken, async (req, res) => {
  try {
      const stream = await Stream.findById(req.params.id);
      if (!stream) {
          return res.status(404).json({ message: 'Stream not found' });
      }

      res.json({ status: stream.isLive ? 'live' : 'waiting' });
  } catch (err) {
      console.error('Error fetching stream status:', err);
      res.status(500).json({ message: 'Error fetching stream status', error: err.message });
  }
});

// Update the existing route or add this if it doesn't exist
app.post('/streams/:id/update-artist-stream', verifyToken, async (req, res) => {
  try {
    console.log('Received update artist stream request');
    console.log('Stream ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);

    const { username, thetaID, rtmpKey, rtmpServer } = req.body;
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      console.log('Stream not found');
      return res.status(404).json({ message: 'Stream not found' });
    }

    console.log('Stream found:', stream);
    console.log('Stream participants:', stream.participants);

    const artistIndex = stream.participants.findIndex(p => p.username === username);
    console.log('Artist index:', artistIndex);
    console.log('Searching for username:', username);

    if (artistIndex === -1) {
      console.log('Artist not found in stream participants');
      return res.status(404).json({ message: 'Artist not found in stream participants' });
    }

    // Update the participant's information while preserving existing data
    stream.participants[artistIndex] = {
      ...stream.participants[artistIndex],
      username, // Ensure username is included
      thetaID,
      rtmpKey,
      rtmpServer
    };

    console.log('Updated stream participants:', stream.participants);

    await stream.save();
    console.log('Stream saved successfully');
    res.json({ message: 'Artist stream information updated successfully', stream });
  } catch (err) {
    console.error('Error updating artist stream information:', err);
    res.status(500).json({ message: 'Error updating artist stream information', error: err.message });
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
    const { rtmpKey, rtmpServer, type, thetaID } = req.body;
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
    stream.type = type || 'battle';
    stream.thetaID = thetaID;  // Add this line to update the thetaID
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

// Update this route in server.js
app.get('/api/check-battle-stream/:streamId', async (req, res) => {
  const { streamId } = req.params;
  
  try {
      // Remove the verifyToken middleware if it's not needed for this public route
      // If authentication is required, ensure the token is being sent correctly from the client

      const battle = await Battle.findOne({
          $or: [
              { thetaStreamID: streamId },
              { opponentThetaStreamID: streamId }
          ]
      });

      if (battle) {
          console.log(`Battle found for stream ID ${streamId}:`, battle);
          res.json({ battle });
      } else {
          console.log(`No battle found for stream ID ${streamId}`);
          res.json({ message: 'No matching battle found' });
      }
  } catch (err) {
      console.error('Error checking for battle stream:', err);
      res.status(500).json({ message: 'Error checking for battle stream', error: err.message });
  }
});

app.get('/api/battle/:battleId', async (req, res) => {
  const { battleId } = req.params;

  try {
    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    res.json(battle);
  } catch (err) {
    console.error('Error fetching battle data:', err);
    res.status(500).json({ message: 'Error fetching battle data', error: err.message });
  }
});

// Update the voting route
app.post('/api/vote/:battleId', verifyToken, async (req, res) => {
  const { battleId } = req.params;
  const { artist, username, action } = req.body;

  try {
    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    const isVotedForArtist1 = battle.votedBy.includes(username);
    const isVotedForArtist2 = battle.opponentVotedBy.includes(username);

    if (action === 'add') {
      if (isVotedForArtist1 || isVotedForArtist2) {
        return res.status(400).json({ message: 'You have already voted' });
      }

      if (artist === 'artist1') {
        battle.votes += 1;
        battle.votedBy.push(username);
      } else if (artist === 'artist2') {
        battle.opponentVotes += 1;
        battle.opponentVotedBy.push(username);
      } else {
        return res.status(400).json({ message: 'Invalid artist' });
      }
    } else if (action === 'remove') {
      if (artist === 'artist1' && isVotedForArtist1) {
        battle.votes -= 1;
        battle.votedBy = battle.votedBy.filter(voter => voter !== username);
      } else if (artist === 'artist2' && isVotedForArtist2) {
        battle.opponentVotes -= 1;
        battle.opponentVotedBy = battle.opponentVotedBy.filter(voter => voter !== username);
      } else {
        return res.status(400).json({ message: 'No vote to remove' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await battle.save();

    res.json({ 
      artist1Votes: battle.votes, 
      artist2Votes: battle.opponentVotes
    });
  } catch (err) {
    console.error('Error voting:', err);
    res.status(500).json({ message: 'Error voting', error: err.message });
  }
});

// Add a new route to fetch current vote counts
app.get('/api/battle/:battleId/votes', async (req, res) => {
  const { battleId } = req.params;

  try {
    const battle = await Battle.findOne({ battleId });

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    res.json({
      artist1Votes: battle.votes,
      artist2Votes: battle.opponentVotes
    });
  } catch (err) {
    console.error('Error fetching vote counts:', err);
    res.status(500).json({ message: 'Error fetching vote counts', error: err.message });
  }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add this route near your other app.get routes
app.get('/gt/virtual_gallery.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'gt', 'virtual_gallery.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});