const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  IsEmailVerified: String,
  IsPhoneVerified: String,
  IsPasswordChanged: String,
  LoginTimes: String,
  createdAt: Date,
  UserName: String,
  Email: String,
  Password: String,
  UserType: String,
  Phone: String,
  SubscriberName: String,
  SubscriberUIN: String,
  UIN: Number,
  PasswordHash: String,
});

const User = mongoose.model("user", userSchema);
module.exports = User;
