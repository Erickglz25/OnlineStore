var express = require('express');
var router = express.Router();
var csrf = require('csurf');

//controllers
var userctrl = require('../controllers/usercontroller');
var adminctrl = require('../controllers/admincontrollers');

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/dashboard',userctrl._isAdmin,adminctrl._renderDashboard);

router.get('/',userctrl.notLoggedIn,userctrl._standard_function);

module.exports = router;
