const express = require('express');
const router = express.Router();
const User = require('../models/User');
const URLModel = require('../models/URL');
const URLVote = require('../models/URLVote');
const Comment = require('../models/Comment');
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
    const urls = await URLModel.find({ url: regex })
        .sort({ points: 'desc' })
        .limit(5);

    const results = {
        urls: await Promise.all(
            urls.map(async u => ({
                ...(await u.getPrepared(req.user.id)),
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
        url: await url.getPrepared(req.user.id)
    });
});

// Toggle vote
router.post('/:id/vote', async (req, res) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ error: 'You need to be logged in to vote' });
    }

    const voteValue = req.body.value;

    if (voteValue !== 1 && voteValue !== -1) {
        return res.status(400).json({ error: 'Invalid value' });
    }

    const urlID = req.params.id;

    const url = await URLModel.findById(urlID);

    if (!url) {
        return res.status(400).json({ error: 'That URL does not exist' });
    }

    const previousVote = await URLVote.findOne({
        user: req.user.id,
        url: urlID
    });

    if (previousVote) {
        if (voteValue === 1) {
            if (previousVote.value === 1) {
                await URLVote.deleteOne({ _id: previousVote.id }).exec();
                await URLModel.updateOne(
                    { _id: previousVote.url },
                    { $inc: { points: -1 } }
                ).exec();
            } else if (previousVote.value === -1) {
                await URLVote.updateOne(
                    { _id: previousVote.id },
                    { value: 1, registrationDate: new Date() }
                ).exec();
                await URLModel.updateOne(
                    { _id: previousVote.url },
                    { $inc: { points: 2 } }
                ).exec();
            }
        } else if (voteValue === -1) {
            if (previousVote.value === -1) {
                await URLVote.deleteOne({ _id: previousVote.id }).exec();
                await URLModel.updateOne(
                    { _id: previousVote.url },
                    { $inc: { points: 1 } }
                ).exec();
            } else if (previousVote.value === 1) {
                await URLVote.updateOne(
                    { _id: previousVote.id },
                    { value: -1, registrationDate: new Date() }
                ).exec();
                await URLModel.updateOne(
                    { _id: previousVote.url },
                    { $inc: { points: -2 } }
                ).exec();
            }
        }

        const newURL = await URLModel.findById(urlID);

        return res
            .status(200)
            .json({ url: await newURL.getPrepared(req.user.id) });
    } else {
        await new URLVote({
            user: req.user.id,
            url: urlID,
            value: voteValue
        })
            .save()
            .then(async () => {
                await URLModel.updateOne(
                    { _id: urlID },
                    { $inc: { points: voteValue } }
                );

                const newURL = await URLModel.findById(urlID);

                return res
                    .status(201)
                    .json({ url: await newURL.getPrepared(req.user.id) });
            })
            .catch(() => {
                return res.status(500).json({ error: 'An error occurred' });
            });
    }
});

// Get comments
router.get('/:id/comments', async (req, res) => {
    const urlID = req.params.id;

    const url = await URLModel.findById(urlID);

    if (!url) {
        return res.status(400).json({ error: 'That URL does not exist' });
    }

    const comments = await Promise.all(
        (await Comment.find({ url: urlID })).map(
            async c => await c.getPrepared()
        )
    );

    return res.status(200).json({ comments });
});

// Post comment
router.post('/:id/comments', async (req, res) => {
    if (!req.user) {
        return res
            .status(401)
            .json({ error: 'You need to be logged in to comment' });
    }

    const commentText = req.body.text;

    if (!commentText) {
        return res.status(400).json({ error: 'No comment text received' });
    }

    const urlID = req.params.id;

    const url = await URLModel.findById(urlID);

    if (!url) {
        return res.status(400).json({ error: 'That URL does not exist' });
    }

    await new Comment({
        url: urlID,
        user: req.user.id,
        text: commentText
    })
        .save()
        .then(async comment => {
            return res.status(201).json({
                comment: await comment.getPrepared()
            });
        })
        .catch(() => {
            return res.status(500).json({ error: 'An error occurred' });
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
            url: await existingURL.getPrepared(req.user.id)
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
                url: await url.getPrepared(req.user.id)
            });
        })
        .catch(() => {
            return res.status(500).json({ error: 'An error occurred' });
        });
});

module.exports = router;
