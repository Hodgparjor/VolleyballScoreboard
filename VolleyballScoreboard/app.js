var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var server = http.createServer(app);
// var { Server } = require('socket.io');
var { wss } = require('./routes/matches').wss;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var matchesRouter = require('./routes/matches').router;

var app = express();

// Database
var { Pool } = require('pg');
var connectionString = 'postgresql://volleyballdb_owner:wdAz4V9vLPqi@ep-shiny-sun-a2r1vzmn.eu-central-1.aws.neon.tech/volleyballdb?sslmode=require';
var pool = new Pool({
  connectionString: connectionString
});

// Websocket
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/matches', matchesRouter);

app.get('/', (req, res, next) => {
  res.render('index');
});


app.get('/matches', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM mecze ORDER BY date ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.delete('/matches/:id', (req, res, next) => {
  try {
    const matchId = req.params.id;
    pool.query(`DELETE FROM mecze WHERE id = ${matchId}`);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

app.get('/matches/:id', async (req, res, next) => {
  try {
    const matchId = req.params.id;
    const result = await pool.query(`SELECT * FROM mecze WHERE id = ${matchId}`);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});


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
    

    res.json(actionResult.rows[0]);
  } catch (err) {
    next(err);
  }
});

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


module.exports = app;