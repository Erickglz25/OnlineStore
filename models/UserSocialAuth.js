var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userSocialAuth = new Schema({
	  name: {type: String},
    email: {type: String,required:true},
    pfid: {type: String, required: true, unique: true},
    token: {type: String, required: true},
    isAdmin: {type:Boolean, required:true, default:false}
});

module.exports = mongoose.model('UserSocialAuth', userSocialAuth);
