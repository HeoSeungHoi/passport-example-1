var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var mysql = require('mysql');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash'); // use passport flash message
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'me',
  password: 'secret',
  database: 'my db'
});

connection.connect();

/* set middlewares */
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'enter secret key',
  resave: false,
  saveUninitialized: false
}));
app.use(flash()); // flash message
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  /* db 에서 id를 이용하여 user를 얻어서 done을 호출합니다 */
  connection.query('SELECT * FROM users WHERE `id`=?', [id], function(err, rows) {
    var user = rows[0];
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, function(username, password, done) {
  connection.query('SELECT * FROM users WHERE `username`=?', [username], function(err, rows) {
    var user = rows[0];
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  });
}));

/* controllers */
app.get('/', function(req, res, next) {
  res.send('hello world');
});

app.route('/login')
.get(function(req, res, next) {
  console.log(req.flash('error'));
  if (req.user) {
    res.send('already login');
  } else {
    res.sendFile(__dirname + '/index.html');
  }
}).post(passport.authenticate('local', {
  successRedirect: '/login',
  failureRedirect: '/login',
  failureFlash: true
}));

app.listen(3000, function() {
  console.log('Server Start');
});
