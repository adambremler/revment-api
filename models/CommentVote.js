const mongoose = require('mongoose');

const CommentVoteSchema = new mongoose.Schema({
    url: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'URL',
        required: true
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
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

CommentVoteSchema.methods.getPrepared = function getPrepared() {
    return {
        id: this.id,
        url: this.url,
        comment: this.comment,
        user: this.user,
        registrationDate: this.registrationDate
    };
};

module.exports = mongoose.model('CommentVote', CommentVoteSchema);
