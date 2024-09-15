const express = require('express');
const WebSocket = require('ws');
const router = express.Router();
const JSON = require('JSON');

// Moduły bazy danych
var { Pool } = require('pg');
var connectionString = 'postgresql://volleyballdb_owner:wdAz4V9vLPqi@ep-shiny-sun-a2r1vzmn.eu-central-1.aws.neon.tech/volleyballdb?sslmode=require';

// Tworzenie połączenia do bazy danych
var pool = new Pool({
  connectionString: connectionString
});

let matchData;

// Konfiguracja WebSocket
const wss = new WebSocket.Server({ port: 4000 });

async function dbUpdateMatch(matchId, result, resultDetailed, status) {
  //console.log("Updating match in db ID: " + matchId + ", result " + result + ", status: " + status + ", result detailed: " + resultDetailed.resD);
  // await pool.query(`UPDATE mecze SET status = '${status}' WHERE id = ${matchId}`);
  const sql = `UPDATE mecze SET result = $1, resultDetailed = $2, status = $3 WHERE id = $4`
  const params = [result, resultDetailed, status, matchId];
  await pool.query(sql, params);
}

// Logika WebSocket
wss.on('connection', (ws) => {
  // Wysłanie bieżącego stanu meczu do nowego połączenia
  ws.send(JSON.stringify(matchData));

  ws.on('message', function (message) {
    const data = JSON.parse(message);
    
    if (data.action === 'matchDataChanged') {
      // Zaktualizuj resultDetailed w bazie danych
      dbUpdateMatch(data.id, data.result, data.resultdetailed, data.status);
    }
  
    // Rozsyłaj zaktualizowane dane do klientów
    wss.broadcast(data);
  });
});

wss.broadcast = function broadcast(msg) {
  console.log(msg);
  wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(msg));
   });
};

async function getMatchData(matchId) {
  const result = await pool.query(`SELECT * FROM mecze WHERE id = ${matchId}`);
  matchData = result;
  return result;
}

// Obsługa widoku meczu
router.get('/match/:id', async (req, res) => {
  const matchId = req.params.id;
  // Pobieranie szczegółów meczu z bazy danych na podstawie matchId (tu tymczasowe dane)
  const result = await pool.query(`SELECT * FROM mecze WHERE id = ${matchId}`);
  matchData = result.rows[0];
  res.render('matchDetails', { match: result });
});

module.exports = {router, wss};
