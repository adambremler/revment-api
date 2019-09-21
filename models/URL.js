const mongoose = require('mongoose');

const URLSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    screenshotPath: {
        type: String,
        required: true,
        unique: true
    },
    registration_date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

URLSchema.index({ url: 'text' });

module.exports = mongoose.model('URL', URLSchema);
