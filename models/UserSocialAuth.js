var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var userSocialAuth = new Schema({
	  name: {type: String},
    email: {type: String}, //email can't be required because it is not obligatory for facebook
    pfid: {type: String, required: true, unique: true},
    token: {type: String, required: true},
    isAdmin: {type:Boolean, required:true, default:false}
});

module.exports = mongoose.model('UserSocialAuth', userSocialAuth);
