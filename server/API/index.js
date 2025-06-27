const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Weather API server is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 