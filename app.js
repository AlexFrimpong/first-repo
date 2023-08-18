const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const keys = require('./config/passport-setup');
const googleRoute = require('./routes/googleRoutes');
const cors = require('cors');
const app = express();

// Passport Config
require('./config/passport')(passport);


//database connection error handling
const handleError = function (err) {
  console.log(err.message);
}

// Connect to MongoDB
const connection = mongoose.connect('mongodb://127.0.0.1/userAuthentication')
  .then(response => app.listen(5000))
  .catch(error => handleError(error));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//cors configuration
app.use(
  cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
  })
)


// Express session
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: 'mongodb://127.0.0.1/userAuthentication',
      autoRemove: 'interval',
      autoRemoveInterval: '5'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.err_msg = req.flash('err_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/api/users', require('./routes/users.js'));
app.use('/Auth', googleRoute);
