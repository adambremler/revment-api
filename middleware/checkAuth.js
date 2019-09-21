const jwt = require('jsonwebtoken');
const User = require('../models/User');

const checkAuth = (req, res, next) => {
    try {
        if (req.token) {
            jwt.verify(req.token, process.env.JWTSECRET, (err, decoded) => {
                if (!err) {
                    User.findById(decoded.user.id)
                        .then(user => {
                            req.user = user;
                            req.authErr = false;

                            next();
                        })
                        .catch(e => {
                            throw e;
                        });
                } else {
                    throw err;
                }
            });
        } else {
            throw 'Invalid token type';
        }
    } catch (e) {
        req.user = false;
        req.authError = e;

        return next();
    }
};

module.exports = checkAuth;
