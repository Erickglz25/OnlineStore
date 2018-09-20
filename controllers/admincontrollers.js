var Order = require('../models/order');

exports._renderDashboard = function(req,res,next){

  Order.countDocuments({status:'Pending'},function(err, result) {

    if (err) return res.write('Error orders not found');

    res.render('layouts/dashboard',{
      layout: 'dashboard.hbs',
      username: req.user.name,
      orders: result
    });


  });
}
