const rejectExpiredToken = (req, res, next) => {
    if (req.authError) {
        const error = req.authError;

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
    }

    return next();
};

module.exports = rejectExpiredToken;
