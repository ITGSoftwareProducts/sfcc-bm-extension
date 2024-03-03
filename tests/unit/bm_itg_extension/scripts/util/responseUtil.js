const assert = require('assert');
const Response = require('../../../../mock/util/Response');
const DW = require('../../../../mock/dw');

describe('responseUtil', () => {
    global.dw = DW;
    const responseModule = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/responseUtil');
    beforeEach(() => {
        global.response = new Response();
    });
    afterEach(() => {
        global.response = null;
    });

    it('should render JSON response when object is provided', () => {
        const mockObject = { key: 'value' };

        responseModule.renderJSON(mockObject);

        // Assertions to check if response methods were called and JSON was printed
        assert.strictEqual(global.response.contentTypeSet, true);
        assert.strictEqual(global.response.headersSet, true);
        assert.strictEqual(global.response.writer.printed, JSON.stringify(mockObject));
    });

    it('should not render JSON response when object is not provided', () => {
        responseModule.renderJSON(null);

        // Assertions to check if response methods were not called
        assert.strictEqual(global.response.contentTypeSet, true);
        assert.strictEqual(global.response.headersSet, true);
        assert.strictEqual(global.response.writer.printed, '');
    });
});
