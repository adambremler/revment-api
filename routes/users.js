const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Sign up user
router.post('/sign-up', async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Check if email already exists
    await User.findOne({ email }).then(user => {
        if (user)
            return res
                .status(400)
                .json({ error: 'An account with that email already exists' });
    });

    await User.findOne({ username }).then(user => {
        if (user)
            return res.status(400).json({
                error: 'An account with that username already exists'
            });
    });

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;

            // Create new user with req data
            const newUser = new User({
                email,
                username,
                password: hash
            });

            newUser
                .save()
                .then(async user => {
                    const payload = {
                        user: {
                            id: user.id,
                            email: user.email,
                            username: user.username
                        }
                    };

                    // Create token - send it with response
                    const token = jwt.sign(payload, process.env.JWTSECRET, {
                        expiresIn: '1d'
                    });

                    return res.json({
                        token,
                        user: payload.user
                    });
                })
                .catch(() => {
                    res.status(500).json({ error: 'An error occurred' });
                });
        });
    });
});

// Log in user
router.post('/log-in', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(401).json({ error: 'Please enter all fields' });
    }

    User.findOne({ username })
        .then(user => {
            if (user) {
                bcrypt.compare(password, user.password).then(async isAuthed => {
                    if (isAuthed) {
                        const payload = {
                            user: {
                                id: user.id,
                                email: user.email,
                                username: user.username
                            }
                        };

                        let token = jwt.sign(payload, process.env.JWTSECRET, {
                            expiresIn: '1d'
                        });

                        return res.json({
                            token,
                            user: payload.user
                        });
                    } else {
                        res.status(400).json({
                            error: 'Wrong username or password'
                        });
                    }
                });
            } else {
                res.status(400).json({
                    error: 'Wrong username or password'
                });
            }
        })
        .catch(() => {
            res.status(500).json({ error: 'An error occurred' });
        });
});

module.exports = router;
