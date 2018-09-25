var Order = require('../models/order');
var User = require('../models/user');
var SocialUser = require('../models/UserSocialAuth');
var Product = require('../models/Product');
var fileUpload = require('express-fileupload');

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
    if (err) res.redirect('/error');
    else{
      res.render('admin/orders',{
        layout: 'dashboard.hbs',
        orders:orders
      });
    }
  });
};

exports._renderProducts = function(req, res){

  Product.find({},function(err,products){
    if (err) res.redirect('/error');
    else{
      res.render('admin/products',{
        layout: 'dashboard.hbs',
        products: products
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

        if (req.files){
          let sampleFile = req.files.sampleFile;

          //add new image to the existing array
          sampleFile.mv('/images/dbase/' + req.files.sampleFile , function(err) {
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
