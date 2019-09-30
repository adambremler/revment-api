const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
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
    text: {
        type: String,
        maxlength: 1000,
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

CommentSchema.methods.getPrepared = async function getPrepared() {
    const comment = await this.model('Comment')
        .findById(this.id)
        .populate('user');

    return {
        id: comment.id,
        url: comment.url,
        user: {
            id: comment.user.id,
            username: comment.user.username
        },
        text: comment.text,
        points: comment.points,
        registrationDate: comment.registrationDate
    };
};

module.exports = mongoose.model('Comment', CommentSchema);
