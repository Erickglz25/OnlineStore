var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const status_list = [
  'Pending',
  'In process ...',
  'Delivering',
  'Canceled',
  'Completed'
];

var orderSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User'},
	cart: {type: Object, required: true},
  name: {type: String,required:true},
  address:{type:String,required:true},
	paymentId: {type: String, required: true},
	orderdate: {type: String, required: true},
  status: {
    type: String,
    enum: status_list,
    default: 'Pending'
  }
});


module.exports = mongoose.model('Order', orderSchema);
