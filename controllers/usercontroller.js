var User = require('../models/user');
var Order = require('../models/order');
var Cart = require('../models/cart');
var passport = require('passport');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var mongoose = require('mongoose');
var nev = require('../config/email-verification')(mongoose);
var TempUser = require('../models/tempUser');

exports._standard_function = function(req,res,next){
  next();
}

exports._load_profile = function(req, res) {
  var messages = req.flash('error');
  var msg = req.flash('success');

  Order.find({user: req.user}, function(err, orders) {
      if (err) {
          return res.write('Error! User not found');
      }
      var cart;

      orders.forEach(function(order) {

          cart = new Cart(order.cart);
          order.items = cart.generateArray();

      });
      res.render('user/profile', {
        orders: orders, username: req.user.name,
        messages:messages,
        hasErrors:messages.length > 0,
        msg:msg,
        hasErrors1:msg.length > 0
      });
  });
};

exports._logout = function(req,res,next){
  req.logout();
  res.redirect('/');
}

exports._rendersignin = function(req,res,next){
  var messages = req.flash('error');
  var msg = req.flash('success');
  res.render('user/signin',{
    csrfToken: req.csrfToken(),
    messages:messages,
    hasErrors:messages.length > 0,
    msg:msg,
    hasErrors1:msg.length > 0
  });
}

exports._rendersignup = function(req,res,next){
  var messages = req.flash('error');
  var msg = req.flash('success');
  res.render('user/signup',{
    csrfToken: req.csrfToken(),
    messages:messages,
    hasErrors:messages.length > 0,
    msg:msg,
    hasErrors1:msg.length > 0
  });
}

exports._URL_flow = function(req,res,next){
	if (req.session.oldUrl) {
		var oldUrl = req.session.oldUrl;
		req.session.oldUrl=null;
		res.redirect(oldUrl);
	}else {
    if (req.isAuthenticated()) {
      if (req.user.isAdmin == true) {
        res.redirect('/admin/dashboard');
      }else {
        res.redirect('/user/profile');
      }
    }else
    res.redirect('/user/profile');
  }
};

exports._passport_local_signin = passport.authenticate('local.signin',{
  	failureRedirect: '/user/signin',failureFlash: true
});

exports._passport_local_signup = passport.authenticate('local.signup',{
	failureRedirect: '/user/signup',failureFlash: true
});

exports._URL_flow_signup = function(req,res,next){
  req.flash('success','An email has been sent to you. Please check it to verify your account.');
  res.redirect('/user/profile');
  /*
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl;
    res.redirect(oldUrl);
  }else{
    res.redirect('/user/signup');
  }
  *///for no-email-verification APPS
}

exports._renderforgot = function(req,res, next){
  var messages = req.flash('error');
  var msg = req.flash('success');
  res.render('user/forgot',{
    csrfToken:req.csrfToken(),
    messages:messages,
    hasErrors:messages.length > 0,
    msg:msg,
    hasErrors1:msg.length > 0
  })
};

exports._forgotprocess = function(req, res, next) {

  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/user/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: process.env.MSERVICE,
        auth: {
            user: process.env.MUSER,
            pass: process.env.MPASS
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'Do Not Reply <process.env.MUSER>',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('back');
  });
}

exports._render_reset = function(req, res){
  User.findOne({resetPasswordToken: req.params.token,resetPasswordExpires: { $gt: Date.now() } },
    function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/user/forgot');
      }
      var messages = req.flash('error');
      var msg = req.flash('success');
      res.render('user/reset', {
        csrfToken: req.csrfToken(),
        tok:req.params.token,
        messages:messages,
        hasErrors:messages.length > 0,
        msg:msg,
        hasErrors1:msg.length > 0
      });
  });
}

exports._resetprocess = function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        var password = req.body.password;
        var password2 = req.body.password2;

        req.checkBody('password', 'password is required').notEmpty();
        req.checkBody('password', 'password should contain at least 8 characters').isLength({min: 8, max: 25});
        req.checkBody('password2', 'passwords dont match').equals(password);

        var errors = req.validationErrors();
        if (errors) {
            var messages = [];
            errors.forEach(function(error) {
               messages.push(error.msg);
            });
            req.flash('error', messages);
            return res.redirect('back');
        }

        user.password = user.encryptPassword(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: process.env.MSERVICE,
        auth: {
            user: process.env.MUSER,
            pass: process.env.MPASS
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'Do Not Reply <process.env.MSERVICE>',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
};

exports._emailverification = function(req,res){

  nev.configure({
      verificationURL: 'http://localhost:3000/user/email-verification/${URL}',
      persistentUserModel: User,
      tempUserModel: TempUser,
      expirationTime: 160000, // 10 minutes
      transportOptions: {
          service: process.env.MSERVICE,
          auth: {
              user: process.env.MUSER,
              pass: process.env.MPASS
          }
      }
  }, function(err, options) {
      if (err) {
          return;
      }
  });

    var url = req.params.URL;
    nev.confirmTempUser(url, function(err, user) {
        if (user) {
            nev.sendConfirmationEmail(user.email, function(err, info) {
                if (err) {
                return
                req.flash('success','sending confirmation email FAILED');
            		res.redirect('/store');
                }
                req.flash('success',' GRET! YOUR ACCOUNT HAS BEEN CONFIRMED!');
                req.login(user, function (err) {
                    if (!err ){
                        res.redirect('/user/profile');
                    } else {
                        res.redirect('/signup');
                    }
                });

            });
        } else {
        	req.flash('success','confirming temp user FAILED');
          res.redirect('/store');
        }
    });
}

exports._googleauth = passport.authenticate('google',{scope:['profile','email']});

exports._googlecb =  passport.authenticate('google', { failureRedirect: '/user/signin' });

exports._facebookauth = passport.authenticate('facebook',{scope: 'email'});

exports._facebookcb =  passport.authenticate('facebook', { failureRedirect: '/user/signin'});



//----------------------------------------------


exports.isLoggedIn = function (req,res,next){
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/user/signin');
};

exports.notLoggedIn = function(req,res,next){
	if (!req.isAuthenticated()) {
		return next();
	}
	res.redirect('/');
}

exports._isAdmin = function(req,res,next){
  if (req.isAuthenticated()) {
    if (req.user.isAdmin == true) {
      return next();
    }
  }
  res.redirect('/user/signin');
}
