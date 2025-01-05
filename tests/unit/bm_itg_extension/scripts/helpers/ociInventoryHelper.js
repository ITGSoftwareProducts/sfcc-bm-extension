const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
var StringUtils = require('../../../../mock/dw/util/StringUtils');
const File = require('../../../../mock/dw/io/File');
const FileReader = require('../../../../mock/dw/io/FileReader');
const ProductInventoryMgr = require('../../../../mock/dw/catalog/ProductInventoryMgr');
var Site = require('../../../../mock/dw/system/Site');
const DW = require('../../../../mock/dw');

describe('ociInventoryHelper', function () {
    let ociRequestBuilderInstance = {
        setOciAction: sinon.stub().returnsThis(),
        setBody: sinon.stub().returnsThis(),
        execute: sinon.stub().returns({ data: {
            error: false,
            serviceError: false,
            groups: [{ records: [{
                productId: '123',
                location: 'location',
                onHandQty: '10',
                safetyStock: '5',
                futureQty1: '10',
                futureQtyDate1: '2025-01-01',
                futureQty2: '10',
                futureQtyDate2: '2025-01-01'
            }] }]
        }
        })
    };

    let ociStub = {
        RequestBuilder: sinon.stub().returns(ociRequestBuilderInstance)
    };
    let ociEnums = {
        ENDPOINTS: {
            UPDATE_INVENTORY_RECORD: {
                api: 'availability-records/actions/batch-update',
                method: 'POST',
                type: 'availability'
            }
        }
    };
    let OciRecordModel = sinon.stub();
    let constants = {
        OMNI_CHANNEL_INVENTORY: {
            IMPEX_PATH: '/bm-extension/OCI/',
            GROUPS_AND_LOCATIONS_FOLDER: 'GroupsAndLocations/',
            GROUPS_AND_LOCATIONS_FILE: 'GroupsAndLocations.json'
        }
    };
    const dateUtil = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/dateUtil.js', {
        'dw/system/Site': Site,
        'dw/system/System': DW.system.System,
        'dw/util/StringUtils': StringUtils
    });
    var ociInventoryHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/ociInventoryHelper', {
        'dw/util/Calendar': sinon.stub(),
        'dw/io/File': File,
        'dw/catalog/ProductInventoryMgr': ProductInventoryMgr,
        'dw/io/FileReader': FileReader,
        '~/cartridge/scripts/helpers/constants': constants,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/util/oci': ociStub,
        '*/cartridge/scripts/util/ociUtils/ociEnums': ociEnums,
        '*/cartridge/models/ociRecordModel': OciRecordModel,
        '~/cartridge/scripts/util/dateUtil': dateUtil
    });
    beforeEach(() => {
        sinon.reset();
    });
    describe('#updateInventoryRecord', function () {
        it('should update inventory record', function () {
            var params = {
                productId: '123',
                location: 'location',
                onHandQty: '10',
                safetyStock: '5',
                futureQty1: '10',
                futureQtyDate1: '2025-01-01',
                futureQty2: '10',
                futureQtyDate2: '2025-01-01'
            };
            ociInventoryHelper.updateOrAddInventoryRecord(params);
            assert.isTrue(ociRequestBuilderInstance.setOciAction.calledOnceWith(ociEnums.ENDPOINTS.UPDATE_INVENTORY_RECORD));
            assert.isTrue(ociRequestBuilderInstance.setBody.calledOnce);
            assert.isTrue(ociRequestBuilderInstance.execute.calledOnce);
        });
    });
    describe('#getGroupsAndLocations', function () {
        it('should get groups and locations', function () {
            const fileContentObject = {
                groups: [
                    { id: '1', name: 'group1' },
                    { id: '2', name: 'group2' }
                ],
                downloadTime: '2024-01-31T12:00:00Z'
            };
            var result = ociInventoryHelper.getGroupsAndLocations();
            assert.deepEqual(result.groupsAndLocations, fileContentObject.groups);
            assert.strictEqual(result.downloadTime, fileContentObject.downloadTime);
        });
    });

    describe('#searchInventory', function () {
        it('should return records for a group inventory', function () {
            var result = ociInventoryHelper.searchInventory(['123'], '1');
            assert.strictEqual(result.isGroup, true);
            assert.strictEqual(result.inventoryId, '1');
        });
        it('should handle errors and service errors', () => {
            ociStub.RequestBuilder.returns({
                setOciAction: sinon.stub().returnsThis(),
                setBody: sinon.stub().returnsThis(),
                execute: () => {
                    return {
                        data: {},
                        error: 'Some error',
                        serviceError: 'Service error'
                    };
                }
            });
            var result = ociInventoryHelper.searchInventory(['mockProductId']);
            assert.deepEqual(result, {});
        });
    });
});
