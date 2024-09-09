const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pg = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(session({ secret: 'volleyball-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth2.0
passport.use(new GoogleStrategy({
   clientID: 'YOUR_GOOGLE_CLIENT_ID',
   clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
   callbackURL: '/auth/google/callback',
}, (token, tokenSecret, profile, done) => {
   // Zapisz użytkownika do bazy danych lub znajdź go
   done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.get('/auth/google', passport.authenticate('google', { scope: ['email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
   res.redirect('/home');
});

// Baza danych (PostgreSQL)
const pool = new pg.Pool({
   connectionString: 'postgres://user:password@localhost/volleyball',
});

// WebSocket
io.on('connection', (socket) => {
   console.log('User connected');
   socket.on('updateScore', (data) => {
      io.emit('updateScore', data);
   });
   socket.on('disconnect', () => console.log('User disconnected'));
});

// API mecze
app.get('/matches', async (req, res) => {
   try {
      const result = await pool.query('SELECT * FROM mecze ORDER BY date DESC');
      res.json(result.rows);
   } catch (error) {
      res.status(500).send('Database error');
   }
});

// Uruchom serwer
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
