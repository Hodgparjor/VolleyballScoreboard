var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var server = http.createServer(app);
// var { Server } = require('socket.io');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Moduły bazy danych
var { Pool } = require('pg');
var connectionString = 'postgresql://volleyballdb_owner:wdAz4V9vLPqi@ep-shiny-sun-a2r1vzmn.eu-central-1.aws.neon.tech/volleyballdb?sslmode=require';

// Tworzenie połączenia do bazy danych
var pool = new Pool({
  connectionString: connectionString
});

// var io = new Server(server); // Tworzenie serwera WebSocket


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// Endpoint do renderowania strony głównej
app.get('/', (req, res, next) => {
  res.render('index'); // Renderowanie pliku index.pug
});

// Endpoint do pobierania meczów z bazy danych
app.get('/matches', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM mecze ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Endpoint do dodawania nowego meczu
app.post('/matches', async (req, res, next) => {
  const { date, teamA_name, teamB_name, result, resultDetailed, status } = req.body;
  try {
    const insertQuery = `
      INSERT INTO mecze (date, teamA_name, teamB_name, result, resultDetailed, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [date, teamA_name, teamB_name, result, resultDetailed, status];
    const actionResult = await pool.query(insertQuery, values);
    
    // // Emitowanie aktualizacji WebSocketów po dodaniu meczu
    // io.emit('updateScore', result.rows[0]);

    res.json(actionResult.rows[0]);
  } catch (err) {
    next(err);
  }
});

// // WebSocket: Nasłuchiwanie połączenia
// io.on('connection', (socket) => {
//   console.log('A user connected');
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// server.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

module.exports = app;
