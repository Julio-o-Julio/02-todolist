const express = require('express');
const cors = require('cors');
const todoRoutes = require('./routes/todoRoutes');
const tagRoutes = require('./routes/tagRoutes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(todoRoutes);
app.use(tagRoutes);

app.get('/', (request, response) => {
  return response.json('up');
});

module.exports = app;
