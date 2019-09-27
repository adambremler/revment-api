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
    points: {
        type: Number,
        default: 0,
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now,
        required: true
    }
});

URLSchema.index({ url: 'text' });
URLSchema.methods.getPrepared = async function getPrepared(userID = null) {
    const url = await this.model('URL')
        .findById(this.id)
        .populate('registeredBy');

    if (userID) {
        var vote = await this.model('URLVote').findOne({
            url: url.id,
            user: userID
        });
    }

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
        points: url.points,
        registrationDate: url.registrationDate,
        ...(vote ? { voteValue: vote.value } : {})
    };
};

module.exports = mongoose.model('URL', URLSchema);
