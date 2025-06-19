const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  title: {
    type: String,
    enum: ['Mr', 'Ms', 'Mrs', 'Miss'],
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = function(candidatePassword) {
    return this.password === candidatePassword;
  };

module.exports = mongoose.model('User', UserSchema);