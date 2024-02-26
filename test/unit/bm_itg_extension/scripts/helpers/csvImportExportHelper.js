const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const OCAPI = require('../../../../mock/util/OCAPI');
const StringUtils = require('../../../../mock/dw/util/StringUtils');
const Resource = require('../../../../mock/dw/web/Resource');
const Site = require('../../../../mock/dw/system/Site');
const Logger = require('../../../../mock/dw/system/Logger');
let inventoryAttributes = {
    'attributes': {
        'productId': {
            'displayName': 'Product ID',
            'rules': {
                'mandatory': true
            }
        },
        'allocation': {
            'displayName': 'Allocation'
        },
        'allocationTimeStamp': {
            'displayName': 'Allocation Timestamp'
        },
        'perpetual': {
            'displayName': 'Perpetual'
        },
        'preorderBackorderHandling': {
            'displayName': 'Preorder Backorder Handling'
        },
        'preorderBackorderAllocation': {
            'displayName': 'Preorder Backorder Allocation'
        },
        'ats': {
            'displayName': 'ATS'
        },
        'onOrder': {
            'displayName': 'On Order'
        },
        'turnover': {
            'displayName': 'Turnover'
        },
        'inStockDatetime': {
            'displayName': 'In Stock Datetime'
        }
    },
    'type': 'inventory',
    'ocapiSystemAttributeType': 'ProductInventoryRecord',
    'systemAttributes': [
        'UUID',
        'creationDate',
        'lastModified'
    ]
};
const {
    attributeDefinitionsResponseMock,
    jobExecutionSearchResponseMock,
    searchJobResponseMock,
    PriceBookMgrMock,
    CustomObjectMgrMock
} = require('../../../../mock/controllers');

describe('CSVImportExportHelper', function () {
    let RequestBuilderStub = sinon.stub();
    let BatchBuilderStub = sinon.stub();
    let jobServicesHelperStub = {
        executeJob: sinon.stub()
    };
    let constantsStub = {
        COUPON_REPLICATOR: {
            FIRST_JOB_ID: 'firstJobId',
            SECOND_JOB_ID: 'secondJobId',
            IMPEX_PATH: '/path/to/impex/'
        },
        CSV_IMPORT_EXPORT: {
            DATA_TYPES: {
                CUSTOMER: 'customer',
                CUSTOMER_GROUP: 'customerGroup',
                STORE: 'store',
                INVENTORY: 'inventory',
                PRICEBOOK: 'priceBook'
            },
            MIN_MAPPING_LENGTH: 3,
            DATA_MAPPING: {
                CUSTOM_OBJECT_TYPE: 'CSVMappingConfigType'
            }
        }
    };

    const Transaction = require('../../../../mock/dw/system/Transaction');


    let csvImportExportHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/csvImportExportHelper', {
        'dw/util/Calendar': sinon.stub(),
        'dw/system/Site': Site,
        'dw/system/Logger': Logger,
        'dw/web/Resource': Resource,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/helpers/constants': constantsStub,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelperStub,
        '~/cartridge/scripts/util/ocapi': OCAPI,
        'dw/catalog/PriceBookMgr': PriceBookMgrMock,
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/schemas/profileAttributes.json': {},
        '*/cartridge/scripts/schemas/customerGroupAttributes.json': {},
        '*/cartridge/scripts/schemas/inventoryAttributes.json': inventoryAttributes,
        '*/cartridge/scripts/schemas/priceBookAttributes.json': {},
        '*/cartridge/scripts/schemas/storeAttributes.json': {}
    });

    beforeEach(function () {
        RequestBuilderStub = sinon.stub();
        BatchBuilderStub = sinon.stub();
        global.empty = function (value) { return value == null || value === ''; };

        sinon.replace(OCAPI.RequestBuilder.prototype, 'execute', RequestBuilderStub);
        sinon.replace(OCAPI.BatchBuilder.prototype, 'execute', BatchBuilderStub);
    });

    afterEach(function () {
        sinon.restore();
    });

    describe('#getSchemaData', function () {
        it('should retrieve schema data for recognized import/export type INVENTORY', () => {
            const type = constantsStub.CSV_IMPORT_EXPORT.DATA_TYPES.INVENTORY;

            const result = csvImportExportHelper.getSchemaData(type);

            assert.deepEqual(result, inventoryAttributes);
        });

        it('should retrieve schema data for recognized import/export type PRICEBOOK', () => {
            const type = constantsStub.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK;

            const result = csvImportExportHelper.getSchemaData(type);

            assert.deepEqual(result, undefined);
        });

        it('should retrieve schema data for unrecognized import/export type', () => {
            const type = '';

            const result = csvImportExportHelper.getSchemaData(type);

            assert.deepEqual(result, undefined);
        });
    });

    describe('#createCustomObj', function () {
        it('should create a custom object with valid input parameters', () => {
            const objectAttr = ['attr1', 'attr2'];
            const csvAttr = ['value1', 'value2'];
            const mappingName = 'mapping';
            const type = 'type';
            var getCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'getCustomObject').returns(null);
            var createCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'createCustomObject').returns({ custom: {} });

            const result = csvImportExportHelper.createCustomObj(objectAttr, csvAttr, mappingName, type);

            assert.deepEqual(result, {
                custom: {
                    mappingJson: '[{"attr1":"value1"},{"attr2":"value2"}]'
                }
            });
            getCustomObjectStub.restore();
            createCustomObjectStub.restore();
        });
        it('should update a custom object with valid input parameters', () => {
            const objectAttr = ['attr1', 'attr2'];
            const csvAttr = ['value1', 'value2'];
            const mappingName = 'mapping';
            const type = 'type';
            const editMode = true;
            var getCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'getCustomObject').returns({ custom: {} });
            var createCustomObjectStub = sinon.stub(CustomObjectMgrMock, 'createCustomObject').returns({ custom: {} });

            const result = csvImportExportHelper.createCustomObj(objectAttr, csvAttr, mappingName, type, editMode);

            assert.deepEqual(result, {
                custom: {
                    mappingJson: '[{"attr1":"value1"},{"attr2":"value2"}]'
                }
            });
            getCustomObjectStub.restore();
            createCustomObjectStub.restore();
        });
    });

    describe('#getSavedMappingObj', function () {
        it('should return an array of saved mapping configurations when given a valid type', () => {
            const type = 'validType';
            const customObjects = [{ custom: { mappingJson: 'mappingJson1', mappingId: 'mappingId1' } }];
            var nextFlag = true;
            const queryCustomObjectsStub = sinon.stub(CustomObjectMgrMock, 'queryCustomObjects').returns({ hasNext: () => nextFlag,
                next: () => {
                    nextFlag = false;
                    return customObjects[0];
                } });

            const result = csvImportExportHelper.getSavedMappingObj(type);

            assert.deepEqual(result, [{ 'mappingObject': 'mappingJson1', 'mappingId': 'mappingId1' }]);

            queryCustomObjectsStub.restore();
        });
    });

    describe('#getAttributeDefinitions', function () {
        const attributeDefinitionsResponse = {
            ok: true,
            data: {
                hits: [
                    {
                        id: 1,
                        job_id: 'job1',
                        execution_status: 'completed',
                        exit_status: { status: 'ok', message: 'exit msg1' },
                        end_time: '2022-06-10T16:00:00.000Z',
                        parameters: [
                            {
                                name: 'ProcessType',
                                value: 'paramValue'
                            }
                        ],
                        status: 'OK',
                        log_file_path: '/test/log.txt'
                    }
                ]
            },
            count: 2,
            total: 10,
            start: 0
        };

        it('should return the OCAPI response containing attribute definitions for the specified object type', () => {
            const type = 'product';

            const expectedResult = attributeDefinitionsResponse;
            RequestBuilderStub.returns(attributeDefinitionsResponse);

            const result = csvImportExportHelper.getAttributeDefinitions(type);

            var RequestBuilderSpy = sinon.spy(OCAPI, 'RequestBuilder');
            assert.deepEqual(result, expectedResult);
            assert.isTrue(RequestBuilderSpy.prototype.execute.calledOnce);
        });
    });
    describe('#getDataMapping', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return the expected data mapping object when given a valid type and mappingId', () => {
            const type = 'validType';
            const mappingId = 'validMappingId';

            const currentSite = {
                ID: 'siteID'
            };
            sinon.stub(Site, 'getCurrent').returns(currentSite);

            const mappingName = StringUtils.format('{0}-{1}-{2}', currentSite.ID, type, mappingId);
            const dataMapping = {};

            sinon.stub(CustomObjectMgrMock, 'getCustomObject').withArgs(constantsStub.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, mappingName).returns(dataMapping);

            const result = csvImportExportHelper.getDataMapping(type, mappingId);

            assert.strictEqual(result, dataMapping);
        });

        it('should handle different site IDs and concatenate them with the type and mappingId to form the mapping name', () => {
            const type = 'validType';
            const mappingId = 'validMappingId';

            const currentSite = {
                ID: 'siteID'
            };
            sinon.stub(Site, 'getCurrent').returns(currentSite);

            const mappingName = StringUtils.format('{0}-{1}-{2}', currentSite.ID, type, mappingId);
            const dataMapping = {};

            sinon.stub(CustomObjectMgrMock, 'getCustomObject').withArgs(constantsStub.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, mappingName).returns(dataMapping);

            const result = csvImportExportHelper.getDataMapping(type, mappingId);

            assert.strictEqual(result, dataMapping);
        });
    });
    describe('#validateMappingAttrs', () => {
        it('should return a success object with success=false when objectAttr length is less than MIN_MAPPING_LENGTH', () => {
            const objectAttr = ['attr1', 'attr2'];
            const type = 'inventory';

            const result = csvImportExportHelper.validateMappingAttrs(objectAttr, type);

            assert.isFalse(result.success);
            assert.strictEqual(result.errorMessage, Resource.msg('import.export.min.mapping.length', 'csvImportExport', null));
        });
        it('should return a success object with success=false when objectAttr.indexOf(attr) === -1', () => {
            const objectAttr = ['attr1', 'attr2', 'attr3'];
            const type = 'inventory';

            const result = csvImportExportHelper.validateMappingAttrs(objectAttr, type);

            assert.isFalse(result.success);
            assert.isArray(result.missedMandatoryAttributes);
        });
    });
    describe('#addPriceAndInventoryData', () => {
        it('should return an object with allPriceBooks property as null when allPriceBooks is empty', () => {
            const result = {
                allPriceBooks: [],
                inventoryListIds: ['inventory1', 'inventory2']
            };
            const expected = {
                allPriceBooks: [],
                inventoryListIds: ['inventory1', 'inventory2']
            };
            RequestBuilderStub.returns(searchJobResponseMock);

            const actual = csvImportExportHelper.addPriceAndInventoryData(result);
            assert.deepEqual(actual, expected);
        });
    });
    describe('#executeCsvImportExportJob', () => {
        it('should execute CSV import/export job successfully with valid parameters', () => {
            const params = {
                dataType: constantsStub.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK,
                processType: 'import',
                priceBookId: '12345',
                dataMappingName: 'mapping'
            };
            const fileName = 'file.csv';

            const expectedResult = {
                success: true,
                executionObj: {}
            };

            const currentSite = {
                ID: 'siteId'
            };
            sinon.stub(Site, 'getCurrent').returns(currentSite);

            const formattedTimestamp = '20220101120000';
            sinon.stub(StringUtils, 'formatCalendar').returns(formattedTimestamp);

            jobServicesHelperStub.executeJob.returns(expectedResult.executionObj);

            const result = csvImportExportHelper.executeCsvImportExportJob(params, fileName);
            assert.deepEqual(result, expectedResult);
            Site.getCurrent.restore();
            StringUtils.formatCalendar.restore();
        });
        it('should set the correct job parameters for price book import/export', () => {
            const params = {
                dataType: constantsStub.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK,
                processType: 'import',
                priceBookId: '12345',
                dataMappingName: 'mapping'
            };
            const fileName = 'file.csv';

            const expectedJobParams = {
                SiteScope: JSON.stringify({ named_sites: ['siteId'] }),
                ProcessType: 'import',
                CSVFilePath: 'formattedValue',
                ImportFileName: 'file.csv',
                PriceBookID: '12345',
                DataMappingName: 'formattedValue',
                ObjectID: '12345',
                ExportFileName: 'formattedValue',
                OTBFilePath: 'formattedValue',
                XMLFilePath: 'formattedValue',
                ImpexType: 'price_book'
            };

            const currentSite = {
                ID: 'siteId'
            };
            sinon.stub(Site, 'getCurrent').returns(currentSite);

            const formattedTimestamp = '20220101120000';
            sinon.stub(StringUtils, 'formatCalendar').returns(formattedTimestamp);

            csvImportExportHelper.executeCsvImportExportJob(params, fileName);

            assert.deepEqual(jobServicesHelperStub.executeJob.args[0][1], expectedJobParams);

            Site.getCurrent.restore();
            StringUtils.formatCalendar.restore();
        });
        it('should generate CSV file with correct file name and path', () => {
            RequestBuilderStub.returns(searchJobResponseMock);

            const params = {
                dataType: constantsStub.CSV_IMPORT_EXPORT.DATA_TYPES.INVENTORY,
                processType: 'export',
                inventoryId: '67890',
                dataMappingName: 'mapping'
            };
            const fileName = 'file.csv';

            const currentSite = {
                ID: 'siteId'
            };

            sinon.stub(Site, 'getCurrent').returns(currentSite);
            const formattedTimestamp = '20220101120000';
            StringUtils.formatCalendar = sinon.stub().returns(formattedTimestamp);

            const jobResponse = {
                success: true,
                executionObj: {}
            };

            jobServicesHelperStub.executeJob.returns(jobResponse);

            const result = csvImportExportHelper.executeCsvImportExportJob(params, fileName);
            assert.equal(result.success, true);
        });
    });
    describe('#addCustomAttributes', () => {
        it('should add custom attributes to the schema object when csvToXml is false', () => {
            const schema = {
                ocapiSystemAttributeType: 'inventory',
                systemAttributes: [],
                attributes: {}
            };
            const csvToXml = false;
            const xmlSchema = {};
            const parentRecord = 'record';
            RequestBuilderStub.returns(attributeDefinitionsResponseMock);
            BatchBuilderStub.returns(jobExecutionSearchResponseMock);

            const result = csvImportExportHelper.addCustomAttributes(schema, csvToXml, xmlSchema, parentRecord);
            assert.deepEqual(result, {
                ocapiSystemAttributeType: 'inventory',
                systemAttributes: [],
                attributes: {
                    'custom.1': {
                        displayName: '1'
                    },
                    'custom.2': {
                        displayName: '2'
                    }
                }
            });
        });
        it('should add custom attributes to the XML schema object when csvToXml is true', () => {
            const schema = {
                ocapiSystemAttributeType: 'inventory',
                systemAttributes: [],
                attributes: {}
            };
            const csvToXml = true;
            const xmlSchema = {
                elements: {
                    record: {
                        elements: {}
                    }
                }
            };
            const parentRecord = 'record';
            RequestBuilderStub.returns(attributeDefinitionsResponseMock);
            BatchBuilderStub.returns(jobExecutionSearchResponseMock);
            const result = csvImportExportHelper.addCustomAttributes(schema, csvToXml, xmlSchema, parentRecord);
            assert.deepEqual(result, {
                elements: {
                    record: {
                        elements: {
                            'custom-attributes': {
                                elements: {
                                    'custom-attribute': [
                                        {
                                            attributes: {
                                                'attribute-id': {
                                                    mappingAttributeKey: '1'
                                                }
                                            },
                                            value: {
                                                mappingAttributeId: 'custom.1'
                                            },
                                            dataType: 'string'
                                        },
                                        {
                                            attributes: {
                                                'attribute-id': {
                                                    mappingAttributeKey: '2'
                                                }
                                            },
                                            value: {
                                                mappingAttributeId: 'custom.2'
                                            },
                                            dataType: 'string'
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            });
        });
    });
    describe('#getInventoryListId', () => {
        it('should retrieve a list of inventory IDs using the OCAPI when there are no errors', () => {
            RequestBuilderStub.returns(attributeDefinitionsResponseMock);

            BatchBuilderStub.returns(jobExecutionSearchResponseMock);

            const result = csvImportExportHelper.getInventoryListId();
            assert.ok(result);
        });
    });
});
