var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
	name: {type: String, required: true},
	imagePath: String,
	dimensions: String,
	tag: String,
	price: {type: Number, required: true},
	stock: Number,
	code: String,
	author: String,
	weight: String,
	year: Number,
	lifestyle: String,
	rel1: String,
	rel2: String,
	rel3: String,
	description:String,
	sales: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);
