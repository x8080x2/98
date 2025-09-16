
#!/usr/bin/env node

// Remote server script for Replit
// This exposes your email marketing server to be accessible remotely

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for all origins (for remote access)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Proxy all requests to your main application
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  ws: true, // Enable websocket proxying for Vite HMR
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send('Server connection error');
  }
}));

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

console.log('🚀 Starting XEN Email Sender Remote Server...');
console.log(`📡 Proxying requests to main app at localhost:5000`);

app.listen(PORT, HOST, () => {
  console.log(`✅ Remote server running on ${HOST}:${PORT}`);
  console.log(`🌐 External URL: https://${process.env.REPL_SLUG || 'your-repl'}.${process.env.REPL_OWNER || 'username'}.repl.co`);
  console.log(`📋 Ready to accept remote connections for XEN Email Sender`);
});
const HOST = '0.0.0.0'; // Bind to all interfaces for remote access

app.listen(PORT, HOST, () => {
  console.log(`🌐 Remote server proxy running on ${HOST}:${PORT}`);
  console.log(`📡 Proxying requests to local server at localhost:5000`);
  console.log(`🔗 Your app is now accessible remotely!`);
  
  // Log the public URL (Replit will show this)
  if (process.env.REPLIT_DB_URL) {
    const replId = process.env.REPL_ID || 'your-repl';
    const username = process.env.REPL_OWNER || 'user';
    console.log(`🚀 Public URL: https://${replId}.${username}.repl.co`);
  }
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Remote server shutting down...');
  process.exit(0);
});
