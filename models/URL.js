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
    faviconPath: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    registration_date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

URLSchema.index({ url: 'text' });
URLSchema.methods.getPrepared = function getPrepared() {
    return {
        id: this.id,
        url: this.url,
        screenshotPath: this.screenshotPath,
        faviconPath: this.faviconPath,
        title: this.title
    };
};

module.exports = mongoose.model('URL', URLSchema);
