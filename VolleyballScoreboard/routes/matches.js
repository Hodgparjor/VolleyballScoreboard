const express = require('express');
const WebSocket = require('ws');
const router = express.Router();
const JSON = require('JSON');

// Database
var { Pool } = require('pg');
var connectionString = 'postgresql://volleyballdb_owner:wdAz4V9vLPqi@ep-shiny-sun-a2r1vzmn.eu-central-1.aws.neon.tech/volleyballdb?sslmode=require';
var pool = new Pool({
  connectionString: connectionString
});

let matchData;

// Websocket
const wss = new WebSocket.Server({ port: 4000 });

async function dbUpdateMatch(matchId, result, resultDetailed, status) {
  const sql = `UPDATE mecze SET result = $1, resultDetailed = $2, status = $3 WHERE id = $4`
  const params = [result, resultDetailed, status, matchId];
  await pool.query(sql, params);
}

// WebSocket
wss.on('connection', (ws) => {
  // Send currently opened match to websocket client
  if(matchData) {
    matchData.action = 'matchDataChanged';
    ws.send(JSON.stringify(matchData));
  }

  ws.on('message', function (message) {
    const data = JSON.parse(message);
    
    if (data.action === 'matchDataChanged') {
      // Update match in DB
      dbUpdateMatch(data.id, data.result, data.resultdetailed, data.status);
    }
  
    // Broadcast updated match data to all clients
    wss.broadcast(data);
  });
});

wss.broadcast = function broadcast(msg) {
  wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(msg));
   });
};

async function getMatchData(matchId) {
  const result = await pool.query(`SELECT * FROM mecze WHERE id = ${matchId}`);
  matchData = result;
  return result;
}

router.get('/match/:id', async (req, res) => {
  const matchId = req.params.id;
  const result = await pool.query(`SELECT * FROM mecze WHERE id = ${matchId}`);
  matchData = result.rows[0];
  res.render('matchDetails', { match: result });
});

module.exports = {router, wss};
