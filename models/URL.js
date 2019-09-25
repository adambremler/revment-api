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
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now,
        required: true
    }
});

URLSchema.index({ url: 'text' });
URLSchema.methods.getPrepared = async function getPrepared() {
    const url = await this.model('URL')
        .findById(this.id)
        .populate('registeredBy');

    return {
        id: url.id,
        url: url.url,
        screenshotPath: url.screenshotPath,
        faviconPath: url.faviconPath,
        title: url.title,
        registeredBy: {
            id: url.registeredBy.id,
            username: url.registeredBy.username
        },
        registrationDate: url.registrationDate
    };
};

module.exports = mongoose.model('URL', URLSchema);
