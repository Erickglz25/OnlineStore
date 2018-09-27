var Order = require('../models/order');
var User = require('../models/user');
var SocialUser = require('../models/UserSocialAuth');
var Product = require('../models/Product');
var Cart = require('../models/cart');
var nodemailer = require('nodemailer');


exports._renderDashboard = function(req,res,next){

  Order.countDocuments({status:'Pending'},function(err, result) {
    if (err) return res.status(404).send(err);
    User.countDocuments({},function(err, nuser) {
      if (err) return res.status(404).send(err);
      SocialUser.countDocuments({},function(err, nsuser) {
        if (err) return res.status(404).send(err);
        res.render('admin/dash',{
          layout: 'dashboard.hbs',
          username: req.user.name,
          orders: result,
          user_reg: nuser+nsuser
        });
      });
    });
  });

}

exports._renderOrders = function(req, res){
  Order.find({},function(err,orders){
    if (err) return res.status(404).send(err);
    Order.countDocuments({status:'Pending'},function(err, result){
      if (err) return res.status(404).send(err);
      res.render('admin/orders',{
        layout: 'dashboard.hbs',
        orderList:orders,
        newOrders:result
      });
    });
  });
};

exports._renderOrderView = function(req,res){
  var messages = req.flash('error');
  var msg = req.flash('success');

  Order.findOne({_id:req.params.id},function(err,order){

    if (err || order == null) res.redirect('/error');
    else{

      cart = new Cart(order.cart);
      order.items = cart.generateArray();


      res.render('admin/orderview',{
        layout: 'dashboard.hbs',
        order: order,
        csrfToken: req.csrfToken(),
        messages:messages,
        hasErrors:messages.length > 0,
        msg:msg,
        hasErrors1:msg.length > 0
      });
    }
  });
}

exports._updateOrder = function(req,res,next){

  req.checkBody('inputTracking', 'Tracking Number required').notEmpty();
  req.checkBody('inputStatus', 'Status can not be empty').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error){
      messages.push(error.msg);
    });
    req.flash('error',messages);
    res.redirect('back');
  }else{
    Order.findById(req.body.id,function(err,order){

      if (err || order == null) res.redirect('/error');
      else{
        order.status = req.body.inputStatus;
        order.save(function(err,result){
          if (err) return res.status(404).send(err);

          var transporter = nodemailer.createTransport({
           service: process.env.MSERVICE,
           auth: {
                  user: process.env.MUSER,
                  pass: process.env.MPASS
              }
          });

          const mailOptions = {
            from: 'Do Not Reply <process.env.MUSER>', // sender address
            to: order.email, // list of receivers
            subject: 'Order Status', // Subject line
            html: '<p>Your order ....</p>'// plain text body
          };

          transporter.sendMail(mailOptions, function (err, info) {
            if(err) console.log(err);
          });
          req.flash('success', 'An e-mail has been sent to ' + order.email);
          res.redirect('back');


        });
      }
    });
  }
}

exports._renderProducts = function(req, res){

  var messages = req.flash('error');

  Product.find({},function(err,products){
    if (err) res.redirect('/error');
    else{
      res.render('admin/products',{
        layout: 'dashboard.hbs',
        products: products,
        csrfToken:req.csrfToken(),
        messages:messages,
        hasErrors:messages.length > 0
      });
    }
  });
};

exports._renderUpdate = function(req, res){
    var messages = req.flash('error');

  Product.findOne({_id:req.params.id},function(err,product){

    if (err || product == null) res.redirect('/error');
    else{

      res.render('admin/update',{
        layout: 'dashboard.hbs',
        product: product,
        csrfToken: req.csrfToken(),
        messages:messages,
        hasErrors:messages.length > 0
      });
    }
  });
};

exports._deleteproduct = function(req,res,next){
  var productId = req.body.id;

  Product.deleteOne({ _id: productId }, function (err) {
    if (err)res.redirect('/error');
    else
    res.redirect('/admin/products');
    // deleted at most one tank document
  });
};

exports._addproduct = function(req,res,next){


  req.checkBody('inputName', 'Name required').notEmpty();
  req.checkBody('inputPrice', 'Price can not be empty').notEmpty();
  req.checkBody('inputPrice', 'Price can not be empty').isNumeric();



  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error){
      messages.push(error.msg);
    });
    req.flash('error',messages);
    res.redirect('back');
  }else{

    var product = new Product({
      name : req.body.inputName,
      price : req.body.inputPrice
    });

    if (req.files.sampleFile){
      let sampleFile = req.files.sampleFile;


        //add new image to the existing array
        sampleFile.mv('public/images/dbase/'+sampleFile.name, function(err) {

          if (err)
            return res.status(500).send(err);
          if (req.files.sampleFile.name || req.files.sampleFile.length)
              product.img.push({image:req.files.sampleFile.name});

              product.save(function (err, updateproduct) {
                if (err)  res.redirect('/error');
                else
                res.redirect('back');
          });
        });

    }else{

      product.save(function (err, updateproduct) {
        if (err)  res.redirect('/error');
        else
        res.redirect('back');
      });
    }
  }
}

exports._updateproduct = function(req,res,next){

  Product.findById(req.body.id, function (err, product) {

    if (err  || product == null) res.redirect('/error');
    else{

      req.checkBody('inputName', 'Name required').notEmpty();
      req.checkBody('inputPrice', 'Price can not be empty').notEmpty();
      req.checkBody('inputPrice', 'Price can not be empty').isNumeric();

      var errors = req.validationErrors();
      if (errors) {
        var messages = [];
        errors.forEach(function(error){
          messages.push(error.msg);
        });
        req.flash('error',messages);
        res.redirect('back');
      }else{

        product.name = req.body.inputName;
        product.description = req.body.inputDescription;
        product.price = req.body.inputPrice;
        product.stock = req.body.inputStock;

        if (req.files.sampleFile){
          let sampleFile = req.files.sampleFile;

            //add new image to the existing array
            sampleFile.mv('public/images/dbase/'+sampleFile.name, function(err) {

              if (err)
                return res.status(500).send(err);
                if (req.files.sampleFile.name || req.files.sampleFile.length)
                  product.img.push({image:req.files.sampleFile.name});

                  product.save(function (err, updateproduct) {
                    if (err)  res.redirect('/error');
                    else
                    res.redirect('back');
                  });
            });

        }else{

          product.save(function (err, updateproduct) {
            if (err)  res.redirect('/error');
            else
            res.redirect('back');
          });
        }
      }
    }
  });
};

exports._updateproductIMG = function(req,res,next){

  Product.findById(req.body.id, function (err, product) {

    if (err || product == null) res.redirect('/error');
    else{
      if (req.body.arrayid || req.body.arrayid.length)
        product.img.pull({ _id: req.body.arrayid});
      product.save(function (err, updateproduct) {
        if (err)  res.redirect('/error');
        else
        res.redirect('back');
      });
    }
  });
};
