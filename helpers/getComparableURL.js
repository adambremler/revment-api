const normalizeUrl = require('normalize-url');

function getComparableURL(url) {
    try {
        return normalizeUrl(url, {
            stripHash: true,
            stripProtocol: true
        });
    } catch (e) {
        return url;
    }
}

module.exports = getComparableURL;
