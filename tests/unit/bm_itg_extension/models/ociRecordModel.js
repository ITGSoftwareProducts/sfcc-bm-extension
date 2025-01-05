var assert = require('chai').assert;
var sinon = require('sinon');
var StringUtils = require('../../../mock/dw/util/StringUtils');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Site = require('../../../mock/dw/system/Site');
const DW = require('../../../mock/dw');
describe('OciRecordModel', () => {
    const ProductMgr = { getProduct: sinon.stub() };
    const Calendar = sinon.stub();
    const dateUtil = proxyquire('../../../../cartridges/bm_itg_extension/cartridge/scripts/util/dateUtil.js', {
        'dw/system/Site': Site,
        'dw/system/System': DW.system.System,
        'dw/util/StringUtils': StringUtils
    });
    const OciRecordModelClass = proxyquire('../../../../cartridges/bm_itg_extension/cartridge/models/ociRecordModel', {
        'dw/util/StringUtils': StringUtils,
        'dw/catalog/ProductMgr': ProductMgr,
        'dw/util/Calendar': Calendar,
        '~/cartridge/scripts/util/dateUtil': dateUtil
    });
    const request = {
        httpQueryString: ''
    };
    global.request = request;

    it('should create an instance of OciRecordModel with valid input', () => {
        const ociRecord = {
            sku: '12345',
            onHand: 10,
            safetyStockCount: 5,
            reserved: 2,
            ato: 3,
            atf: 4,
            effectiveDate: '2022-01-01T00:00:00Z',
            futures: [
                {
                    quantity: 5,
                    expectedDate: '2022-01-02T00:00:00Z'
                },
                {
                    quantity: 3,
                    expectedDate: '2022-01-03T00:00:00Z'
                }
            ]
        };

        const ociRecordModelInstance = new OciRecordModelClass(ociRecord);

        assert.equal(ociRecordModelInstance.sku, ociRecord.sku);
        assert.equal(ociRecordModelInstance.productName, '');
        assert.equal(ociRecordModelInstance.onHand, '10.00');
        assert.equal(ociRecordModelInstance.safetyStockCount, '5.00');
        assert.equal(ociRecordModelInstance.reserved, '2.00');
        assert.equal(ociRecordModelInstance.ato, '3.00');
        assert.equal(ociRecordModelInstance.atf, '4.00');
        assert.equal(ociRecordModelInstance.effectiveDate, 'formattedCalendar formattedCalendar');
        assert.equal(ociRecordModelInstance.futures.length, 2);
        assert.equal(ociRecordModelInstance.futureExpectations, 8);
    });
    it('should create an instance of OciRecordModel with input where sku is null', () => {
        const ociRecord = {
            sku: null,
            onHand: 10,
            safetyStockCount: 5,
            reserved: 2,
            ato: 3,
            atf: 4,
            effectiveDate: '2022-01-01T00:00:00Z',
            futures: [
                {
                    quantity: 5,
                    expectedDate: '2022-01-02T00:00:00Z'
                },
                {
                    quantity: 3,
                    expectedDate: '2022-01-03T00:00:00Z'
                }
            ]
        };

        const ociRecordModelInstance = new OciRecordModelClass(ociRecord);
        assert.equal(ociRecordModelInstance.sku, null);
    });
    it('should create an instance of OciRecordModel with input where onHand is null', () => {
        const ociRecord = {
            sku: '12345',
            onHand: null,
            safetyStockCount: 5,
            reserved: 2,
            ato: 3,
            atf: 4,
            effectiveDate: '2022-01-01T00:00:00Z',
            futures: [
                {
                    quantity: 5,
                    expectedDate: '2022-01-02T00:00:00Z'
                },
                {
                    quantity: 3,
                    expectedDate: '2022-01-03T00:00:00Z'
                }
            ]
        };

        const ociRecordModelInstance = new OciRecordModelClass(ociRecord);
        assert.equal(ociRecordModelInstance.onHand, '0.00');
    });

    it('should create an instance of OciRecordModel with input where safetyStockCount is null', () => {
        const ociRecord = {
            sku: '12345',
            onHand: 10,
            safetyStockCount: null,
            reserved: 2,
            ato: 3,
            atf: 4,
            effectiveDate: '2022-01-01T00:00:00Z',
            futures: [
                {
                    quantity: 5,
                    expectedDate: '2022-01-02T00:00:00Z'
                },
                {
                    quantity: 3,
                    expectedDate: '2022-01-03T00:00:00Z'
                }
            ]
        };

        const ociRecordModelInstance = new OciRecordModelClass(ociRecord);
        assert.equal(ociRecordModelInstance.safetyStockCount, '0.00');
    });
});
