const express = require('express');
const router = express.Router();
const User = require('../models/User');
const URLModel = require('../models/URL');
const isReachable = require('is-reachable');
const normalizeUrl = require('normalize-url');
const compareUrls = require('compare-urls');
const puppeteer = require('puppeteer');
const uuidv4 = require('uuid/v4');

// Search
router.get('/search', (req, res) => {
    const query = req.query.q;
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    const url = await URLModel.findById(id);

    if (!url) {
        return res.status(400).json({ error: 'That URL does not exist' });
    }

    return res.json({
        url: {
            id: url.id,
            url: url.url,
            screenshotPath: url.screenshotPath
        }
    });
});

module.exports = router;
