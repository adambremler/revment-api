const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 40
    },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20
    },
    password: { type: String, required: true },
    type: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },
    registration_date: { type: Date, default: Date.now, required: true }
});

module.exports = mongoose.model('User', UserSchema);
