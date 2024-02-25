var URLUtils = require('dw/web/URLUtils');

/**
 * Adds parameters to a given URL using Salesforce Commerce Cloud (SFCC) URLUtils module.
 * @param {string} url - The original URL to which parameters will be added.
 * @param {Object} params - An object containing key-value pairs of parameters to be added.
 * @returns {string} - The modified URL with added parameters.
 */
function addParamsToUrl(url, params) {
    var urlObj = URLUtils.https(url);
    var urlPath = urlObj.toString();

    // Loop through the parameters and add them to the URL
    Object.keys(params).forEach(function (key) {
        if (urlPath.indexOf('?') === -1) {
            urlPath += '?' + key + '=' + encodeURIComponent(params[key]);
        } else {
            urlPath += '&' + key + '=' + encodeURIComponent(params[key]);
        }
    });

    return urlPath;
}

exports.addParamsToUrl = addParamsToUrl;
