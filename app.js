const express = require('express');
const path = require('path');
const { getCurrencyRates } = require('./src/rates');

const app = express();
const publicDirectory = path.join(__dirname, 'public');

app.disable('x-powered-by');

app.get('/', (request, response) => {
  response.sendFile('index.html', { root: publicDirectory });
});

app.get('/about', (request, response) => {
  response.sendFile('about.html', { root: publicDirectory });
});

app.get('/api/rates/:currency', (request, response) => {
  const result = getCurrencyRates(request.params.currency);

  if (!result) {
    return response.status(404).json({ error: 'Currency not supported' });
  }

  return response.json(result);
});

app.use(express.static(publicDirectory));

app.use((request, response) => {
  response.status(404).json({ error: 'Not found' });
});

module.exports = app;
