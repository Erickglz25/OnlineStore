var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
require('dotenv').config();
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');
var validator = require('express-validator');
var passport  = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);
var fileUpload = require('express-fileupload');

var routes = require('./routes/index');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');

var app = express();

//Connect to database
mongoose.set('useCreateIndex', true)
mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true });

require('./config/passport');


var db = mongoose.connection;

db.on('error', console.log.bind(console, 'connection error:'));

db.once('open', function() {
  console.log('Connection Success');
})

// view engine setup
app.engine('.hbs', exphbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(
    session({
        secret: 'Ms4arB',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ mongooseConnection: mongoose.connection}),
        cookie: { maxAge: 100*60*1000}
    }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    next();
});


app.use(fileUpload({
  limits: { fileSize: 5000000 },
}));

app.use('/', routes);
app.use('/user',userRoutes);
app.use('/admin',adminRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
