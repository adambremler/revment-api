const storeToken = (req, res, next) => {
    const bearerHeader = req.headers.authorization;

    const token =
        typeof bearerHeader === 'string' ? bearerHeader.split(' ')[1] : false;

    req.token = token && bearerHeader.startsWith('Bearer ') && token;

    return next();
};

module.exports = storeToken;
