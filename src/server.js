const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

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