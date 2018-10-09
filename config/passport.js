var passport = require('passport');
var User = require('../models/user');
var UserSocialAuth = require('../models/UserSocialAuth');
var mongoose = require('mongoose');
var nev = require('./email-verification')(mongoose);
var TempUser = require('../models/tempUser');
var LocalStrategy =require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

nev.configure({
    verificationURL: process.env.LPA + '/user/email-verification/${URL}',
    persistentUserModel: User,
    expirationTime: 160000, // 10 minutes
    tempUserModel: TempUser,
    transportOptions: {
        service: process.env.MSERVICE,
        auth: {
            user: process.env.MUSER,
            pass: process.env.MPASS
        }
    },
    verifyMailOptions: {
        from: 'Do Not Reply <process.ENV.MUSER>',
        subject: 'Please confirm account',
        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    }
}, function(error, options){
});

passport.serializeUser(function(user,done){
  done(null,user.id);
});

passport.deserializeUser(function(id,done){
  UserSocialAuth.findById(id,function(err,user){
    if (err) {
        done(err);
    }
      if (user === null) {
              User.findById(id,function(err,user){
                  done(null,user);
              });
      }
      else
      done(null,user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLECLIENTID,
    clientSecret: process.env.GOOGLECLIENTSECRET,
    callbackURL: process.env.GOOGLECALLBACK
  },
  function(accessToken, refreshToken, profile, cb) {
    /*User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });*/

    UserSocialAuth.findOne({'pfid':profile.id},function(err,usersocial){
      if (err) {
        return cb(err);
      }
      if(usersocial){
          return cb(null,usersocial)
      }else{
          var newusersocial = new UserSocialAuth();
          newusersocial.pfid = profile.id;
          newusersocial.token = accessToken;
          newusersocial.name = profile.displayName;
          newusersocial.email = profile.emails[0].value;
          newusersocial.save(function(err){
            if(err)
                throw err;
              else
            return cb(null, newusersocial);
          });
      }
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    callbackURL: process.env.CALLBACKURL,
    profileFields:['displayName','emails']
  },
  function(accessToken, refreshToken, profile, cb) {
    /*User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });*/

    UserSocialAuth.findOne({'pfid':profile.id},function(err,usersocial){
      if (err) {
        return cb(err);
      }
      if(usersocial){
          return cb(null,usersocial)
      }else{

          var newusersocial = new UserSocialAuth();

          newusersocial.pfid = profile.id;
          newusersocial.token = accessToken;
          newusersocial.name = profile.displayName;
          if(profile.emails = 'undefined'){
            newusersocial.email = 'Not proportioned or existing';
          }else{
            newusersocial.email = profile.emails[0].value;
          }

          newusersocial.save(function(err){
            if(err)
                return cb(err);
              else
            return cb(null, newusersocial);
          });
      }
    });
  }
));

passport.use('local.signup',new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },function(req, email, password, done){

  req.checkBody('name', 'Name required').notEmpty();
  req.checkBody('email', 'Email can not be empty').notEmpty();
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('password', 'Password required').notEmpty();
  req.checkBody('password', 'Password should contain at least 8 characters').isLength({min: 8, max: 25});
  req.checkBody('password2', 'Passwords do not match').equals(password);
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error){
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error',messages));
  }

  User.findOne({'email':email},function(err,user){
    if (err) {
      return done(err);
    }
    if (user) {
      return done(null,false,{message: 'email has already been taken'});
    }

    var newUser = new User();
    newUser.email = email;
    newUser.password = newUser.encryptPassword(password);
    newUser.name = req.body.name;

    /*
    newUser.save(function(err,result){
        if (err) {
            return done(err);

        }
        return done(null,newUser);
    });*/ //                         ready for apps without email-verification

    nev.createTempUser(newUser, function(err, existingPersistentUser, newTempUser) {
        if (err) {
            return done(null,false,{message: 'ERROR: creating temp user FAILED'});
        }

        // user already exists in persistent collection
        if (existingPersistentUser) {

            return done(null,false,{message: 'You have already signed up and confirmed your account. Did you forget your password?'});
        }

        // new user created
        if (newTempUser) {
            var URL = newTempUser[nev.options.URLFieldName];

            nev.sendVerificationEmail(email, URL, function(err, info) {

                if (err) {
                return done(null,false,{message: 'ERROR: sending verification email FAILED, try later'});
                }
                return done(null,newUser);
            });
            // user already exists in temporary collection!
        } else {
            return done(null,false,{message: 'You have already signed up. Please check your email to verify your account'});
        }
    });

  })

  }
));

passport.use('local.signin', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
  },function(req, email, password, done){

    req.checkBody('email', 'email required').notEmpty();
    req.checkBody('password', 'password required').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      var messages = [];
      errors.forEach(function(error){
        messages.push(error.msg);
      });
      return done(null,false,req.flash('error',messages));
    }

    TempUser.findOne({'email':email},function(err,user){
      if(err){
        return done(err);
      }
      if(user){
        return done(null,false,{message: 'You have already signed up. Please check your email to verify your account'});
      }
      User.findOne({'email':email},function(err,user){
        if(err){
          return done(err);
        }
        if(!user){
          return done(null,false,{message:'Email is not registered'})
        }

        if(user.lockUntil < Date.now()){
          user.loginAttempts=0;
          user.save(function(err) {

          });
        }
        if (user.loginAttempts > 10) {
          user.lockUntil=Date.now() + 3600000; // 1 hour
          user.save(function(err) {

          });
          return done(null,false,{message:'You have exceeded the number of attempts allowed. try later'});
        }

        if (!user.validPassword(password)) {
          user.loginAttempts++;
          user.lockUntil=Date.now() + 3600000; // 1 hour
          user.save(function(err) {

          });
          return done(null,false,{message:'Wrong password'});
        }
        user.loginAttempts=0;
        user.lockUntil=0; // 1 hour
        user.save(function(err) {

        });
        return done(null,user);
      });
    });
  }
));
