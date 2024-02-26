var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const URLUtils = require('../../../../mock/dw/web/URLUtils');

describe('urlHelper', function () {
    const urlHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/urlHelper', {
        'dw/web/URLUtils': URLUtils
    });

    it('should add a single parameter to the URL correctly', function () {
        const url = 'https://example.com';
        const params = { key: 'value' };
        const expectedUrl = 'https://example.com?key=value';

        const result = urlHelper.addParamsToUrl(url, params);

        assert.strictEqual(result, expectedUrl);
    });

    it('should handle special characters in URL correctly', function () {
        const url = 'https://example.com?query=helloworld';
        const params = { key: 'value' };
        const expectedUrl = 'https://example.com?query=helloworld&key=value';

        const result = urlHelper.addParamsToUrl(url, params);

        assert.strictEqual(result, expectedUrl);
    });
});
