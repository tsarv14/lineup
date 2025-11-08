const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Models (ensure they are loaded)
require('./models/User');
require('./models/Post');
require('./models/Storefront');
require('./models/Plan');
require('./models/Pick');
require('./models/Subscription');
require('./models/Transaction');
require('./models/Review');
require('./models/AuditLog');
require('./models/Message');
require('./models/Event');

const app = express();

// Middleware - CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow all localhost ports for development
    if (origin.match(/^http:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }
    // Allow all Vercel domains
    if (origin.match(/\.vercel\.app$/) || origin.match(/\.railway\.app$/)) {
      return callback(null, true);
    }
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // If no specific origins set, allow all (for easier setup)
      if (allowedOrigins.length === 2 && allowedOrigins.includes('http://localhost:3000')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    // In development, allow all origins
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/creators', require('./routes/creators'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/picks', require('./routes/picks'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/creator/dashboard', require('./routes/creator-dashboard'));
app.use('/api/creator', require('./routes/creator'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/analytics', require('./routes/analytics'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Placeholder new domains
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Capria API is running' });
});

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibely';
console.log('🔗 Attempting to connect to MongoDB...');
console.log('📍 URI:', mongoURI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.error('💡 Check your .env file - make sure MONGODB_URI has your password');
  console.error('💡 Make sure MongoDB Atlas network access allows all IPs (0.0.0.0/0)');
});

const PORT = process.env.PORT || 5000;

// Try to start server, if port is taken, try 5001
const startServer = (port) => {
  try {
    const server = app.listen(port, () => {
      console.log(`🚀 Lineup server running on port ${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${port} is in use, trying port 5001...`);
        setTimeout(() => startServer(5001), 100);
      } else {
        console.error('❌ Server error:', err);
      }
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use, trying port 5001...`);
      setTimeout(() => startServer(5001), 100);
    } else {
      console.error('❌ Server error:', err);
    }
  }
};

startServer(PORT);

