var express = require('express');
var router = express.Router();
var csrf = require('csurf');

//Controllers
var userctrl = require('../controllers/usercontroller');

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/profile',userctrl.isLoggedIn,userctrl._load_profile);

router.get('/logout',userctrl.isLoggedIn,userctrl._logout);

router.use('/',userctrl.notLoggedIn,userctrl._standard_function);

router.get('/signin',userctrl._rendersignin);

router.post('/signin',userctrl._passport_local_signin, userctrl._URL_flow);

router.get('/signup',userctrl._rendersignup);

router.post('/signup', userctrl._passport_local_signup,userctrl._URL_flow_signup);

router.get('/forgot',userctrl._renderforgot);

router.post('/forgot', userctrl._forgotprocess);

router.get('/reset/:token', userctrl._render_reset);

router.post('/reset/:token',userctrl._resetprocess);

router.get('/email-verification/:URL',userctrl._emailverification);

router.get('/auth/google',userctrl._googleauth);

router.get('/auth/google/callback',userctrl._googlecb, userctrl._URL_flow);

router.get('/auth/facebook',userctrl._facebookauth);

router.get('/auth/facebook/callback',userctrl._facebookcb,userctrl._URL_flow);



module.exports = router;
