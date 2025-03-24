const express = require('express');
const path = require('path');
const RakshaWall = require('./firewall');
const { Service } = require('node-windows');

const app = express();
const port = 3000;

// Initialize firewall
const firewall = new RakshaWall({
  logPath: path.join(__dirname, 'logs')
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.get('/api/rules', (req, res) => {
  res.json(firewall.exportRules());
});

app.post('/api/rules', async (req, res) => {
  try {
    const { name, ipAddress } = req.body;
    await firewall.addBlockRule(name, ipAddress);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rules/:name', async (req, res) => {
  try {
    await firewall.removeRule(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/connections', async (req, res) => {
  try {
    const connections = await firewall.getActiveConnections();
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`RakshaWall running at http://localhost:${port}`);
});

// Setup for running as Windows Service
const setupService = () => {
  const svc = new Service({
    name: 'RakshaWall',
    description: 'Host-based JavaScript firewall',
    script: path.join(__dirname, 'server.js')
  });

  svc.on('install', () => {
    svc.start();
    console.log('RakshaWall service installed and started');
  });

  return svc;
};

// Export the service setup function
module.exports.setupService = setupService;