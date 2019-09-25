const express = require('express');
const router = express.Router();
const User = require('../models/User');
const URLModel = require('../models/URL');
const isReachable = require('is-reachable');
const normalizeUrl = require('normalize-url');
const compareUrls = require('compare-urls');
const puppeteer = require('puppeteer');
const download = require('image-downloader');
const uuidv4 = require('uuid/v4');
const escapeRegex = require('../helpers/escapeRegex');
const getComparableURL = require('../helpers/getComparableURL');

// Search
router.get('/search', async (req, res) => {
    const query = getComparableURL(req.query.q);

    if (!query) {
        return res.status(400).json({ error: 'No query provided' });
    }

    const regex = new RegExp(escapeRegex(query), 'gi');
    const urls = await URLModel.find({ url: regex }).limit(5);

    const results = {
        urls: await Promise.all(
            urls.map(async u => ({
                ...(await u.getPrepared()),
                exactMatch: compareUrls(u.url, query)
            }))
        )
    };

    return res.json({
        isQueryReachable: await isReachable(query),
        results
    });
});

// Get URL by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    const url = await URLModel.findById(id);

    if (!url) {
        return res.status(400).json({ error: 'That URL does not exist' });
    }

    return res.json({
        url: await url.getPrepared()
    });
});

// Get URL by URL (create if doesn't exist)
router.get('/', async (req, res) => {
    const inputURL = req.query.url;

    if (!inputURL) {
        return res.status(400).json({ error: 'No URL received' });
    }

    urlToSave = getComparableURL(inputURL);

    // Better solution later, JSON to prevent differences in parameter order?
    const existingURL = await URLModel.findOne({ url: urlToSave });

    if (existingURL) {
        return res.json({
            url: await existingURL.getPrepared()
        });
    }

    if (!req.user) {
        return res
            .status(401)
            .json({ error: 'You need to be logged in to register a URL' });
    }

    normalizedURL = normalizeUrl(urlToSave);

    if (!(await isReachable(normalizedURL))) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    let screenshotPath = null;

    do {
        const screenshotID = uuidv4();

        screenshotPath = `images/urls/screenshots/${screenshotID}.png`;
    } while (await URLModel.findOne({ screenshotPath }));

    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1280,
            height: 720,
            deviceScaleFactor: 1
        }
    });

    const page = await browser.newPage();
    await page.goto(normalizedURL);

    let faviconPath = null;

    const faviconURL = `https://www.google.com/s2/favicons?domain=${normalizedURL}`;

    do {
        const faviconID = uuidv4();

        faviconPath = `images/urls/favicons/${faviconID}.jpg`;
    } while (await URLModel.findOne({ faviconPath }));

    const downloadOptions = {
        url: faviconURL,
        dest: `public/${faviconPath}`
    };

    try {
        await download.image(downloadOptions);
    } catch (e) {
        return res.status(500).json({ error: 'An error occurred' });
    }

    const title = (await page.title()) || 'No title found';
    await page.screenshot({ path: `public/${screenshotPath}` });

    await browser.close();

    await new URLModel({
        url: urlToSave,
        screenshotPath,
        faviconPath,
        title,
        registeredBy: req.user.id
    })
        .save()
        .then(async url => {
            return res.status(201).json({
                url: await url.getPrepared()
            });
        })
        .catch(() => {
            return res.status(500).json({ error: 'An error occurred' });
        });
});

module.exports = router;
