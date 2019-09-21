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

router.get('/', async (req, res) => {
    const inputURL = req.query.url;

    if (!inputURL) {
        return res.status(400).json({ error: 'No URL received' });
    }

    urlToSave = normalizeUrl(inputURL, {
        stripHash: true,
        stripProtocol: true
    });

    // Better solution later, JSON to prevent differences in parameter order?
    const existingURL = await URLModel.findOne({ url: urlToSave });

    if (existingURL) {
        return res.json({
            url: {
                id: existingURL.id,
                url: existingURL.url,
                screenshotPath: existingURL.screenshotPath
            }
        });
    }

    normalizedURL = normalizeUrl(urlToSave);

    if (!(await isReachable(normalizedURL))) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    let screenshotPath = null;

    do {
        const screenshotID = uuidv4();

        screenshotPath = `images/urls/${screenshotID}.png`;
    } while (await URLModel.findOne({ screenshotPath }));

    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1280,
            height: 720,
            deviceScaleFactor: 0.5
        }
    });

    const page = await browser.newPage();
    await page.goto(normalizedURL);
    await page.screenshot({ path: `public/${screenshotPath}` });

    await browser.close();

    await new URLModel({
        url: urlToSave,
        screenshotPath
    })
        .save()
        .then(url => {
            return res.status(201).json({
                url: {
                    id: url.id,
                    url: url.url,
                    screenshotPath: url.screenshotPath
                }
            });
        })
        .catch(() => {
            res.status(500).json({ error: 'An error occurred' });
        });
});

module.exports = router;
