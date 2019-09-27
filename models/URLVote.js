const mongoose = require('mongoose');

const URLVoteSchema = new mongoose.Schema({
    url: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'URL',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now,
        required: true
    }
});

URLVoteSchema.methods.getPrepared = function getPrepared() {
    return {
        id: this.id,
        url: this.url,
        user: this.user,
        registrationDate: this.registrationDate
    };
};

module.exports = mongoose.model('URLVote', URLVoteSchema);
