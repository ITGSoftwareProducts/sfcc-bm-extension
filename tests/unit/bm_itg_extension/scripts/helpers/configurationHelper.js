'use strict';

const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const Site = require('../../../../mock/dw/system/Site');
const Transaction = require('../../../../mock/dw/system/Transaction');
const StringUtils = require('../../../../mock/dw/util/StringUtils');
const Resource = require('../../../../mock/dw/web/Resource');
const File = require('../../../../mock/dw/io/File');
const ProductInventoryMgr = require('../../../../mock/dw/catalog/ProductInventoryMgr');
const Logger = require('../../../../mock/dw/system/Logger');
const { CustomObjectMgrMock } = require('../../../../mock/controllers');
const OCI = require('../../../../mock/util/OCI');
const DW = require('../../../../mock/dw');

describe('configurationHelper', function () {
    let RequestBuilderStub = sinon.stub();
    let constants = {
        CSV_IMPORT_EXPORT: {
            DATA_MAPPING: {
                CUSTOM_OBJECT_TYPE: 'customObjectType'
            }
        },
        OMNI_CHANNEL_INVENTORY: {
            IMPEX_PATH: '/some/impex/path/',
            GROUPS_AND_LOCATIONS_FOLDER: 'groups_and_locations_folder',
            GROUPS_AND_LOCATIONS_FILE: 'groups_and_locations_file'
        }
    };
    let ociEnums = {};
    ociEnums.HTTP_METHODS = Object.freeze({
        GET: 'GET',
        POST: 'POST'
    });
    ociEnums = {
        ENDPOINTS: {
            GET_LOCATION_GRAPG_EXPORT: {
                api: 'location-graph/exports',
                method: ociEnums.HTTP_METHODS.POST,
                type: 'impex'
            },
            DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE: {
                api: 'location-graph/exports/{0}/file-content',
                method: ociEnums.HTTP_METHODS.GET,
                type: 'impex'
            }
        }
    };
    const preferencesHelper = { setPreferenceValue: sinon.stub() };
    const commonFileHelper = { createFileInImpex: sinon.stub() };
    const dateUtil = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/dateUtil.js', {
        'dw/system/Site': Site,
        'dw/system/System': DW.system.System,
        'dw/util/StringUtils': StringUtils
    });
    var { deleteMappingConfig: deleteMappingConfig,
              getDataMapping: getDataMapping,
              convertJsonToArray: convertJsonToArray,
              saveConfiguration: saveConfiguration,
              getLocationGraphExport: getLocationGraphExport,
              downloadLocationGraphExportFile: downloadLocationGraphExportFile,
              isOciInventoryIntegrationMode: isOciInventoryIntegrationMode
                        } = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/configurationHelper.js', {
                            'dw/system/Site': Site,
                            'dw/object/CustomObjectMgr': CustomObjectMgrMock,
                            'dw/system/Transaction': Transaction,
                            'dw/util/StringUtils': StringUtils,
                            'dw/util/Calendar': sinon.stub(),
                            'dw/web/Resource': Resource,
                            'dw/io/File': File,
                            'dw/catalog/ProductInventoryMgr': ProductInventoryMgr,
                            '~/cartridge/scripts/helpers/constants': constants,
                            '~/cartridge/scripts/util/oci.js': OCI,
                            '*/cartridge/scripts/helpers/preferencesHelper': preferencesHelper,
                            '*/cartridge/scripts/util/ociUtils/ociEnums': ociEnums,
                            '~/cartridge/scripts/helpers/commonFileHelper.js': commonFileHelper,
                            'dw/system/Logger': Logger,
                            '~/cartridge/scripts/util/dateUtil': dateUtil,
                            '~/cartridge/scripts/util/guard': {
                                ensure: (filters, action) => sinon.stub().callsFake(action)
                            }
                        });

    beforeEach(function () {
        RequestBuilderStub = sinon.stub();
        sinon.replace(OCI.RequestBuilder.prototype, 'execute', RequestBuilderStub);
        global.empty = function (value) { return value == null || value === ''; };
        sinon.stub(Resource, 'msg');
    });

    afterEach(function () {
        sinon.restore();
    });

    it('should delete mapping config if it exists', function () {
        var mappingId = 'mapping_id';
        var type = 'type';
        var mappingName = 'site_id-type-mapping_id';
        var mappingConfig = {
            custom: {
                [constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE]: {
                    [mappingName]: {}
                }
            }
        };
        var getCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'getCustomObject').returns(mappingConfig);
        var removeCutomObjectStub = sinon.stub(CustomObjectMgrMock, 'remove');

        var result = deleteMappingConfig(type, mappingId);

        assert.isTrue(result.success);
        sinon.assert.calledOnce(CustomObjectMgrMock.remove);

        getCustomObjectStub.restore();
        removeCutomObjectStub.restore();
    });

    it('should not delete anything when the mapping configuration does not exist', function () {
        const mappingId = 'mapping_id';
        const type = 'type';
        var getCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'getCustomObject').returns(null);

        const result = deleteMappingConfig(type, mappingId);

        assert.deepEqual(result, { success: false });

        getCustomObjectStub.restore();
    });

    it('should retrieve a saved mapping configuration when given a valid type and mappingId', function () {
        const type = 'someType';
        const mappingId = 'someMappingId';
        const dataMappingObject = { /* mock data mapping object */ };
        var getCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'getCustomObject').returns(dataMappingObject);

        const result = getDataMapping(type, mappingId);

        assert.strictEqual(result, dataMappingObject);

        getCustomObjectStub.restore();
    });

    it('should return an empty array when the input is not a JSON object', function () {
        const jsonObject = [
                            { 'a': 1, 'b': 2 },
                            { 'c': 3, 'd': 4 }
        ];
        const expectedArray = [
                            [['a', 1], ['b', 2]],
                            [['c', 3], ['d', 4]]
        ];

        assert.deepEqual(convertJsonToArray(jsonObject), expectedArray);
    });

    it('should return an empty array when given an empty JSON object', function () {
        const jsonObject = [];
        const expectedArray = [];

        assert.deepEqual(convertJsonToArray(jsonObject), expectedArray);
    });

    it('should handle nested objects properly', function () {
        const jsonObject = [
                  { 'a': { 'x': 1, 'y': 2 }, 'b': { 'z': 3 } },
                  { 'c': { 'p': 4 }, 'd': { 'q': 5, 'r': 6 } }
        ];
        const expectedArray = [
                  [['a', { 'x': 1, 'y': 2 }], ['b', { 'z': 3 }]],
                  [['c', { 'p': 4 }], ['d', { 'q': 5, 'r': 6 }]]
        ];

        assert.deepEqual(convertJsonToArray(jsonObject), expectedArray);
    });

    it('should convert a JSON object into an array of keys and values', function () {
        const jsonObject = [
                            { name: 'John', age: 30 },
                            { name: 'Jane', age: 25 }
        ];
        const expectedResult = [
                            [['name', 'John'], ['age', 30]],
                            [['name', 'Jane'], ['age', 25]]
        ];

        const result = convertJsonToArray(jsonObject);
        assert.deepEqual(result, expectedResult);
    });

    it('should return an empty array if the input is empty', function () {
        const jsonObject = [];
        const result = convertJsonToArray(jsonObject);
        assert.deepEqual(result, []);
    });

    it('should return an empty array if the input is null', function () {
        const jsonObject = null;
        const result = convertJsonToArray(jsonObject);
        assert.deepEqual(result, []);
    });

    it('should return an empty array if the input is undefined', function () {
        const jsonObject = undefined;
        const result = convertJsonToArray(jsonObject);
        assert.deepEqual(result, []);
    });

    it('should save configuration parameters when valid parameters are passed', function () {
        const params = {
            key1: 'value1',
            key2: 'value2',
            csrf_token: 'token'
        };

        const result = saveConfiguration(params);

        assert.isTrue(result.success, 'Success should be true');
        assert.isUndefined(params.csrf_token, 'csrf_token should be deleted from params');
    });

    it('should not save configuration if params is empty', function () {
        const params = {};
        const result = saveConfiguration(params);
        assert.isTrue(result.success, 'Success should be false');
    });

    it('should handle error properly if error occurred during save configuration', function () {
        const params = {
            key1: 'value1',
            key2: 'value2'
        };
        preferencesHelper.setPreferenceValue.throws(new Error('Some error occurred'));

        const result = saveConfiguration(params);

        assert.isFalse(result.success, 'Success should be false');
        preferencesHelper.setPreferenceValue.reset();
    });

    it('should return an ociResponse object when getLocationGraphExport is called', function () {
        const expectedResponse = {
            success: true
        };
        const expectedResult = expectedResponse;
        RequestBuilderStub.returns(expectedResponse);

        const result = getLocationGraphExport();

        sinon.assert.calledOnce(RequestBuilderStub);
        assert.strictEqual(result, expectedResult);
    });

    it('should successfully download and create a file with the content of the location graph export', function () {
        const exportId = 'some_export_id';
        const ociDownloadResponse = {
            success: true,
            data: {/* mock data */}
        };
        RequestBuilderStub.returns(ociDownloadResponse);
        commonFileHelper.createFileInImpex.returns(true);
        const expectedResponse = {
            success: true,
            responseJSON: {
                locationsDownloadTime: 'formattedCalendar formattedCalendar',
                exportCompleted: true
            }
        };

        const result = downloadLocationGraphExportFile(exportId);

        assert.deepEqual(result, expectedResponse);
        commonFileHelper.createFileInImpex.reset();
    });

    it('should set success to true, exportCompleted to false, and exportId to the given exportId when ociDownloadResponse has errorCode 409', function () {
        const exportId = 'some_export_id';
        const ociDownloadResponse = {
            error: true,
            errorCode: '409'
        };
        const expectedResponse = {
            success: true,
            responseJSON: {
                exportCompleted: false,
                exportId: exportId
            }
        };
        RequestBuilderStub.returns(ociDownloadResponse);
        commonFileHelper.createFileInImpex.returns(true);

        const result = downloadLocationGraphExportFile(exportId);

        assert.deepEqual(result, expectedResponse);
        commonFileHelper.createFileInImpex.reset();
    });

    it('should set serverErrors with errorMessage when ociDownloadResponse has data with errorMessage', function () {
        const exportId = 'some_export_id';
        const errorMessage = 'Some error message';
        const ociDownloadResponse = {
            error: true,
            data: {
                errorMessage: errorMessage
            }
        };
        const expectedResponse = {
            success: false,
            responseJSON: {},
            serverErrors: [errorMessage]
        };
        RequestBuilderStub.returns(ociDownloadResponse);
        commonFileHelper.createFileInImpex.returns(true);

        const result = downloadLocationGraphExportFile(exportId);
        assert.deepEqual(result, expectedResponse);
        commonFileHelper.createFileInImpex.reset();
    });

    it('should set serverErrors with errorMessage when ociDownloadResponse has errorMessage', function () {
        const exportId = 'some_export_id';
        const errorMessage = 'Some error message';
        const ociDownloadResponse = {
            error: true,
            errorMessage: errorMessage
        };
        const expectedResponse = {
            success: false,
            responseJSON: {},
            serverErrors: [errorMessage]
        };
        RequestBuilderStub.returns(ociDownloadResponse);
        commonFileHelper.createFileInImpex.returns(true);

        const result = downloadLocationGraphExportFile(exportId);
        assert.deepEqual(result, expectedResponse);
        commonFileHelper.createFileInImpex.reset();
    });

    it('should set serverErrors with technical error message when none of the conditions are met', function () {
        const exportId = 'some_export_id';
        const ociDownloadResponse = {
            error: true
        };
        const expectedResponse = {
            success: false,
            responseJSON: {},
            serverErrors: [Resource.msg('error.technical', 'common', null)]
        };
        RequestBuilderStub.returns(ociDownloadResponse);
        commonFileHelper.createFileInImpex.returns(true);

        const result = downloadLocationGraphExportFile(exportId);

        assert.deepEqual(result, expectedResponse);
        commonFileHelper.createFileInImpex.reset();
    });

    it('should return true if InventoryIntegrationMode is OCI_CACHE', function () {
        const result = isOciInventoryIntegrationMode();
        assert.isTrue(result);
    });
});
