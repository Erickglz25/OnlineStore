var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
	name: {type: String, required: true},
	img: [{
		image:String
	}],
	imagePath: String,
	price: {type: Number, required: true},
	stock: Number,
	active: {type:Boolean, required:true, default:false},
	description:String,
	sales: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);
