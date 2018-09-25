var Cart = require('../models/cart');
var Product = require('../models/Product.js');
var Order = require('../models/order');

exports._render_root = function(req, res, next) {
  res.render('shop/index');
};

exports._addproduct = function(req, res, next){
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  Product.findById(productId, function(err, product){
    if (err) {

      return res.redirect('/');
    }

    product.sales = product.sales+1;
    product.save();
    cart.add(product, product.id);
    req.session.cart = cart;
    res.redirect('back');
  });
}

exports._reduceproduct = function(req,res,next){
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart: {});

	cart.reduceByOne(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');
}

exports._deleteproduct = function(req,res,next){
	var productId = req.params.id;
	var cart = new Cart(req.session.cart ? req.session.cart: {});

	cart.removeItem(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');
}

exports._render_store = function(req, res, next) {
  Product.find(function(error, productList) {
    var successMsg = req.flash('success')[0];
    if (error) {
      res.send(500,error.message);
    }
    res.render('shop/store',{
      products: productList,
  		successMsg:successMsg,noMessages: !successMsg
    });
  })
}

exports._render_scart = function(req,res,next){
	if (!req.session.cart) {
		return res.render('shop/shopping-cart',{products:null});
	}
	var cart = new Cart(req.session.cart);
	res.render('shop/shopping-cart',{products:cart.generateArray(),totalPrice:cart.totalPrice, totalQty:cart.totalQty});
}

exports.isLoggedIn = function(req,res,next){
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.oldUrl = req.url;
	res.redirect('/user/signin');
};

exports._render_checkout = function(req,res,next){
	if (!req.session.cart) {
		return res.redirect('/shopping-cart');
	}
	var cart = new Cart(req.session.cart);
	var errMsg = req.flash('error')[0];
	res.render('shop/checkout',{csrfToken: req.csrfToken(),total: cart.totalPrice, errMsg:errMsg,noError: !errMsg});

}

exports._checkoutprocess = function(req,res,next){
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }

  req.checkBody('fname', 'Name required').notEmpty();
  req.checkBody('lemail', 'Email can not be empty').notEmpty();
  req.checkBody('lemail', 'Invalid email').isEmail();
  req.checkBody('laddress','Address required').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error){
      messages.push(error.msg);
    });
      req.flash('error',messages)
      return res.redirect('back');
  }
  if(req.body.invalidCheck != 'true'){
    req.flash('error','accept terms to continue')
    return res.redirect('back');
  }

  var hoy  = new Date();
  var cart = new Cart(req.session.cart);
  var cargo = Math.round(cart.totalPrice * 100);

  var stripe = require("stripe")(
    process.env.STRIPE_SK
  );

  stripe.charges.create({

	  amount: cargo,
	  currency: "mxn",
	  source: req.body.stripeToken, // obtained with Stripe.js
	  description: "Test Charge for OnlineStore",
	  metadata: {Name: req.body.fname, LastName: req.body.lname, Address: req.body.laddress},
	}, function(err, charge) {
	  // asynchronously called
	  if (err) {
	  	req.flash('error',err.message);
	  	return res.redirect('checkout');
	  }


	  var order = new Order({
	  	user: req.user,
	  	cart: cart,
      name:req.body.lname + req.body.fname,
      address: req.body.laddress,
      paymentId: charge.id,
      orderdate : hoy
	  });

	  order.save(function(err,result){

	  	/*Order.findById(result, function(err, orderi){
	  		var oitems = orderi.cart.items.item;
	  		console.log()
	  		oitems.forEach(function(lista){
	  				Product.findById(lista,function(err,prod){

	  					prod.sales = prod.sales+1;
	  				});




			});


		}); */

	  	req.flash('success','Successfully bought product!');
		  req.session.cart = null;
		  res.redirect('/store');

	  });
	});
}

exports._renderError = function(req,res,next){
  res.render('error');
};
