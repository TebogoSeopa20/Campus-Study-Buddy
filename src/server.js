require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const usersRouter = require('./backend/api/users-api');


const app = express();
const PORT = 3000;

// Initialize Supabase client with a more explicit configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Create client for admin operations (server-side only)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Create client for user operations (can be exposed to client)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Serve all static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));
// Specifically serve HTML files from the html subdirectory
app.use(express.static(path.join(__dirname, 'frontend', 'html')));

// Route handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'landing.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});