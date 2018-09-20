var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tempuserSchema = new Schema({
  name: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  isAdmin: {type:Boolean, required:true, default:false},
  lockUntil: { type: Number, required: true, default: 0 },
  isAdmin: {type:Boolean, required:true, default:false},
  
  GENERATED_VERIFYING_URL: String,
  createdAt: {
        type: Date,
        expires: 1600,
        default: Date.now
    }
});

module.exports = mongoose.model('tempUser', tempuserSchema);
