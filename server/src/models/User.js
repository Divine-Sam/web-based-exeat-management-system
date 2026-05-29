const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true },
  crawford_number: { type: String, required: true, unique: true, trim: true, uppercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'hall_admin', 'dean', 'security', 'super_admin'], // ✅ added
    required: true
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toProfile = function () {
  return {
    id: this._id.toString(),
    full_name: this.full_name,
    crawford_number: this.crawford_number,
    role: this.role,
    created_at: this.created_at,
    updated_at: this.updated_at,
  };
};

module.exports = mongoose.model('User', userSchema);