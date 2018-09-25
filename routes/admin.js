var express = require('express');
var router = express.Router();
var csrf = require('csurf');

//controllers
var userctrl = require('../controllers/usercontroller');
var adminctrl = require('../controllers/admincontrollers');

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/dashboard',userctrl._isAdmin,adminctrl._renderDashboard);

router.get('/orders',userctrl._isAdmin,adminctrl._renderOrders);

router.get('/products',userctrl._isAdmin,adminctrl._renderProducts);

router.get('/products/update-:id',userctrl._isAdmin,adminctrl._renderUpdate);

router.post('/products/update',userctrl._isAdmin,adminctrl._updateproduct);

router.post('/products/img',userctrl._isAdmin,adminctrl._updateproductIMG);

router.post('/products/delete',userctrl._isAdmin,adminctrl._deleteproduct);

router.get('/',userctrl.notLoggedIn,userctrl._standard_function);

module.exports = router;
