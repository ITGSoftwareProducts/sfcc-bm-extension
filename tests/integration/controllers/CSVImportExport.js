'use strict';

const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const sinon = require('sinon');
const ArrayList = require('../../mock/dw/util/ArrayList');
const Logger = require('../../mock/dw/system/Logger');
const URLUtils = require('../../mock/dw/web/URLUtils');
const File = require('../../mock/dw/io/File');
const ISML = require('../../mock/dw/template/ISML');
const Site = require('../../mock/dw/system/Site');
const Resource = require('../../mock/dw/web/Resource');
const StringUtils = require('../../mock/dw/util/StringUtils');
const { CustomObjectMgrMock, AppUtil, RenderTemplateHelper } = require('../../mock/controllers');

describe('CSVImportExport', function () {
    const csvImportExportHelper = {
        getSavedMappingObj: sinon.stub(),
        getSchemaData: sinon.stub(),
        getDataMapping: sinon.stub(),
        createCustomObj: sinon.stub(),
        executeCsvImportExportJob: sinon.stub(),
        validateMappingAttrs: sinon.stub()
    };
    const jobServicesHelper = { getRecentProcessList: sinon.stub() };
    const Response = {
        renderJson: sinon.stub(),
        renderJSON: sinon.stub()
    };
    const constants = {
        CSV_IMPORT_EXPORT: {
            JOB_ID: 'BM Extension - CSV Import Export',
            RECENT_PROCESSES_NUMBER: 5,
            PRODUCT_MENU: 'prod-cat',
            CUSTOMER_MENU: 'customers',
            MARKETING_MENU: 'marketing',
            DATA_TYPES: {
                PRICEBOOK: 'pricebook',
                INVENTORY: 'inventory'
            },
            DATA_MAPPING: {
                CUSTOM_OBJECT_TYPE: 'CSVMappingConfigType'
            },
            IMPEX_PATH: '{0}/src/bm-extension/CSV_IMPEX/{1}/Export/CSV/'
        }
    };
    const configurationHelper = { convertJsonToArray: sinon.stub(),
        isOciInventoryIntegrationMode: sinon.stub() };

    var { Start: start,
        DataMapping: dataMapping,
        SaveMappingConfiguration: saveMappingConfiguration,
        NewMappingConfiguration: newMappingConfiguration,
        ExecuteCsvImportExportJob: executeCsvImportExportJob
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/CSVImportExport', {
        'dw/template/ISML': ISML,
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        'dw/io/File': File,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Site': Site,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/helpers/csvImportExportHelper': csvImportExportHelper,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelper,
        '*/cartridge/scripts/util/responseUtil': Response,
        '*/cartridge/scripts/renderTemplateHelper': RenderTemplateHelper,
        '*/cartridge/scripts/helpers/constants': constants,
        '*/cartridge/scripts/helpers/configurationHelper': configurationHelper,
        '*/cartridge/scripts/util/app': AppUtil,
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        }
    });

    beforeEach(function () {
        sinon.stub(ISML, 'renderTemplate');
        sinon.stub(RenderTemplateHelper, 'getRenderedHtml').returns('rendered html');
    });

    afterEach(function () {
        sinon.restore();
        Response.renderJSON.reset();
        AppUtil.getRequestFormOrParams.reset();
        csvImportExportHelper.createCustomObj.reset();
    });
    describe('#Start', function () {
        it('should render the main csvImportExport page with correct data and breadcrumbs for product menu', () => {
            AppUtil.getRequestFormOrParams.returns({
                CurrentMenuItemId: 'prod-cat'
            });

            jobServicesHelper.getRecentProcessList.returns({
                success: true,
                executionList: {
                    FILES_MAP: {}
                }
            });
            csvImportExportHelper.addPriceAndInventoryData = sinon.stub().returns({});

            start();

            assert.isTrue(ISML.renderTemplate.calledOnce, 'ISML.renderTemplate should be called once');
            assert.isTrue(ISML.renderTemplate.calledWith('csvImportExport/csvImportExport', {}), 'ISML.renderTemplate should be called with correct data');
        });
        it('should render the errorpage in case of failed getRecentProcessList response for customers', () => {
            AppUtil.getRequestFormOrParams.returns({
                CurrentMenuItemId: 'customers'
            });

            jobServicesHelper.getRecentProcessList.returns({
                success: false,
                errorMessage: 'some error'
            });
            csvImportExportHelper.addPriceAndInventoryData = sinon.stub().returns({});

            start();

            assert.isTrue(ISML.renderTemplate.calledOnce, 'ISML.renderTemplate should be called once');
            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }), 'ISML.renderTemplate should be called with correct data');
        });
        it('should return  an error and render error template on failure', () => {
            AppUtil.getRequestFormOrParams.returns({
                CurrentMenuItemId: 'marketing'
            });
            jobServicesHelper.getRecentProcessList.throws(new Error('An error occurred'));

            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }), 'ISML.renderTemplate should be called with correct data');
            assert.isTrue(ISML.renderTemplate.calledOnce, 'ISML.renderTemplate should be called once');
        });
    });

    describe('#DataMapping', function () {
        it('should return a successful response when called with valid parameters', () => {
            AppUtil.getRequestFormOrParams.returns({ type: 'mockType', editMode: true, processType: 'mockProcess' });
            csvImportExportHelper.getSavedMappingObj.returns(['mockMapping']);
            csvImportExportHelper.getSchemaData.returns({ attributes: ['mockAttribute'] });
            RenderTemplateHelper.getRenderedHtml.returns('rendered html');

            dataMapping();
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledOnce);
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledWith({
                actionUrl: sinon.match.string,
                savedMappingArray: sinon.match.array,
                editMode: sinon.match.bool,
                systemAttribute: sinon.match.string
            }, 'csvImportExport/dataMapping'));

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }), 'Response.renderJSON should be called with correct data');
        });

        it('should handle CSVImportExport failure and render error template if error occurs', () => {
            AppUtil.getRequestFormOrParams.returns({ type: 'mockType', editMode: true });
            csvImportExportHelper.getSchemaData.returns({ });

            RenderTemplateHelper.getRenderedHtml.throws(new Error('An error occurred'));

            dataMapping();
            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });
    });

    describe('#NewMappingConfiguration', function () {
        it('should display error message when an exception is thrown during new mapping configuration', function () {
            csvImportExportHelper.getSchemaData.returns({ attributes: { /* mocked attributes */ } });
            AppUtil.getRequestFormOrParams.returns({ type: 'mockedType', editMode: true, mappingId: 'mockedMappingId' });
            configurationHelper.convertJsonToArray.throws(new Error('Mocked error'));

            newMappingConfiguration();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
            configurationHelper.convertJsonToArray.reset();
        });

        it('should return a success response when called with valid parameters', () => {
            AppUtil.getRequestFormOrParams.returns({ processType: 'mockedType', editMode: true, mappingId: 'mockedMappingId' });
            csvImportExportHelper.getSchemaData.returns({ attributes: { /* mocked attributes */ } });
            csvImportExportHelper.getDataMapping.returns({
                custom: {
                    mappingJson: '{"key": "value"}'
                }
            });
            configurationHelper.convertJsonToArray.returns([{ key: 'key', value: 'value' }]);

            newMappingConfiguration();

            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledOnce, 'RenderTemplateHelper.getRenderedHtml should be called once');
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledWith({
                actionUrl: sinon.match.string,
                keyValueArray: sinon.match.array,
                editMode: sinon.match.bool,
                systemAttribute: sinon.match.string,
                savedMappingId: sinon.match.string,
                processType: sinon.match.string,
                disableAddition: sinon.match.bool
            }, 'csvImportExport/newMappingConfiguration'), 'RenderTemplateHelper.getRenderedHtml should be called with correct data');

            assert.isTrue(Response.renderJSON.calledOnce, 'renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }));
        });

        it('should return a success response when called with empty dataMapping', () => {
            AppUtil.getRequestFormOrParams.returns({ processType: 'mockedType', editMode: true, mappingId: 'mockedMappingId' });
            csvImportExportHelper.getSchemaData.returns({ attributes: { /* mocked attributes */ } });
            csvImportExportHelper.getDataMapping.returns({
                custom: {}
            });
            configurationHelper.convertJsonToArray.returns([{ key: 'key', value: 'value' }]);

            newMappingConfiguration();

            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledOnce, 'RenderTemplateHelper.getRenderedHtml should be called once');
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledWith({
                actionUrl: sinon.match.string,
                keyValueArray: sinon.match.array,
                editMode: sinon.match.bool,
                systemAttribute: sinon.match.string,
                savedMappingId: sinon.match.string,
                processType: sinon.match.string,
                disableAddition: sinon.match.bool
            }, 'csvImportExport/newMappingConfiguration'), 'RenderTemplateHelper.getRenderedHtml should be called with correct data');

            assert.isTrue(Response.renderJSON.calledOnce, 'renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }));
        });
        it('should handle the else if case when editMode is false', function () {
            csvImportExportHelper.getSchemaData.returns({ attributes: { /* mocked attributes */ } });
            configurationHelper.convertJsonToArray.returns([{ key: 'key', value: 'value' }]);
            AppUtil.getRequestFormOrParams.returns({ processType: 'mockedType', mappingId: 'mockedMappingId' });

            newMappingConfiguration();

            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledOnce, 'RenderTemplateHelper.getRenderedHtml should be called once');
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledWith({
                systemAttribute: sinon.match.string,
                actionUrl: sinon.match.string,
                processType: sinon.match.string
            }, 'csvImportExport/newMappingConfiguration'), 'RenderTemplateHelper.getRenderedHtml should be called with correct data');


            assert.isTrue(Response.renderJSON.calledOnce, 'renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }));
        });

        it('should handle error and set errorMessage in result', () => {
            AppUtil.getRequestFormOrParams.returns({ editMode: true });
            csvImportExportHelper.getSchemaData.returns({ });

            newMappingConfiguration();
            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });
    });

    describe('#SaveMappingConfiguration', function () {
        it('should save Import mapping configuration when input data is valid', () => {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: { 'test': 'test' },
                csvAttr: { 'test': 'test' },
                mappingName: 'TestMapping',
                mappingId: 'TestType',
                processType: 'Import'
            });

            csvImportExportHelper.validateMappingAttrs.returns({
                success: true,
                responseJSON: {
                    newMappingName: 'TestMapping'
                }
            });

            csvImportExportHelper.createCustomObj.returns({ some: 'config' });

            saveMappingConfiguration();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                responseJSON: {
                    newMappingName: 'TestMapping'
                }
            }));
        });
        it('should return error while savving Export mapping configuration when createCustomObj is empty', () => {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: { 'test': 'test' },
                csvAttr: { 'test': 'test' },
                mappingName: 'TestMapping',
                mappingId: 'TestType',
                processType: 'Import'
            });

            csvImportExportHelper.validateMappingAttrs.returns({
                success: true,
                responseJSON: {
                    newMappingName: 'TestMapping'
                }
            });

            csvImportExportHelper.createCustomObj.returns(null);

            saveMappingConfiguration();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });
        it('should return error while savving Export mapping configuration when mappingConfigData is invalid', () => {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: { 'test': 'test' },
                mappingName: 'TestMapping',
                mappingId: 'TestType',
                processType: 'Export'
            });

            csvImportExportHelper.validateMappingAttrs.returns({
                success: true,
                responseJSON: {
                    newMappingName: 'TestMapping'
                }
            });

            csvImportExportHelper.createCustomObj.returns(null);

            saveMappingConfiguration();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });

        it('should display error message when an exception is thrown during mapping configuration creation', function () {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: { 'test': 'test' },
                csvAttr: { 'test': 'test' },
                mappingName: 'TestMapping',
                mappingId: 'TestType',
                processType: 'Import'
            });

            csvImportExportHelper.validateMappingAttrs.throws(new Error('An error occurred'));

            saveMappingConfiguration();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                errorMessage: sinon.match.string
            }));
        });

        it('should display error message when  missed mandatory', function () {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: { 'test': 'test' },
                csvAttr: { 'test': 'test' },
                mappingName: 'TestMapping',
                mappingId: 'TestType',
                processType: 'Import'
            });

            csvImportExportHelper.validateMappingAttrs.returns({
                success: true,
                missedMandatoryAttributes: ['Attribute1', 'Attribute2'],
                missedMandatoryIfOtherExist: ['Attribute3', 'Attribute4']
            });
            saveMappingConfiguration();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                missedMandatoryAttributes: ['Attribute1', 'Attribute2'],
                missedMandatoryIfOtherExist: ['Attribute3', 'Attribute4'],
                errorMessage: sinon.match.string
            }));
        });
    });
    describe('#ExecuteCsvImportExportJob', function () {
        it('should handle CSV import/export job successfully', function () {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: {},
                csvAttr: {},
                dataMappingName: 'TestMapping',
                mappingId: 'TestType',
                dataType: 'mockProcess',
                priceBookId: '1234',
                inventoryId: '123'
            });
            var mappingName = 'site_id-type-mapping_id';
            var mappingConfig = {
                custom: {
                    [constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE]: {
                        [mappingName]: {}
                    }
                }
            };
            sinon.stub(StringUtils, 'format').returns('/dir/');
            sinon.stub(Site, 'getCurrent').returns({ ID: 'mockedSiteID' });
            sinon.stub(File.prototype, 'exists').returns(false);

            const request = { httpParameterMap: { processMultipart: function (callback) { return callback(null, null, 'mockedFileName.csv'); } } };

            global.request = request;
            sinon.stub(CustomObjectMgrMock, 'getCustomObject').returns(mappingConfig);

            csvImportExportHelper.executeCsvImportExportJob.returns({
                success: true,
                executionObj: {}
            });

            executeCsvImportExportJob();
            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }));
        });

        it('should return an error message when CSV file has invalid extension', () => {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: {},
                csvAttr: {},
                dataMappingName: 'TestMapping',
                mappingId: 'TestType',
                dataType: 'inventory',
                priceBookId: '123',
                inventoryId: '123',
                processType: 'Import'
            });
            sinon.stub(StringUtils, 'format').returns('/dir/');
            sinon.stub(Site, 'getCurrent').returns({ ID: 'mockedSiteID' });
            sinon.stub(File.prototype, 'exists').returns(false);

            const request = { httpParameterMap: { processMultipart: function (callback) { return callback(null, null, 'mockedFileName.txt'); } } };

            global.request = request;
            csvImportExportHelper.executeCsvImportExportJob.returns({
                success: true,
                executionObj: {}
            });

            executeCsvImportExportJob();
            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });
        it('should return error message when executeCsvImportExportJob returns an error', function () {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: {},
                csvAttr: {},
                dataMappingName: 'TestMapping',
                mappingId: 'TestType',
                dataType: 'mockProcess',
                priceBookId: '1234',
                inventoryId: '123'
            });
            sinon.stub(StringUtils, 'format').returns('');
            sinon.stub(Site, 'getCurrent').returns({ ID: 'mockedSiteID' });
            sinon.stub(File.prototype, 'exists').returns(false);

            const request = { httpParameterMap: { processMultipart: function (callback) { return callback(null, null, 'mockedFileName.csv'); } } };

            global.request = request;
            csvImportExportHelper.executeCsvImportExportJob.returns({ executionObj: { data: { errorMessage: 'Mocked error during job execution' } }, error: true });

            executeCsvImportExportJob();

            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });
        it('should return error message when there is an exception during the export/import', function () {
            AppUtil.getRequestFormOrParams.returns({});
            global.request = { httpParameterMap: { processMultipart: sinon.stub().throws(new Error('Mocked error during job execution')) } };

            executeCsvImportExportJob();
            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });

        it('should returns error message if filepath is empty', function () {
            AppUtil.getRequestFormOrParams.returns({
                objectAttr: {},
                csvAttr: {},
                dataMappingName: '',
                mappingId: 'TestType',
                dataType: 'pricebook',
                priceBookId: '123',
                inventoryId: '123',
                processType: 'Import'
            });
            sinon.stub(StringUtils, 'format').returns('/dir/');
            sinon.stub(Site, 'getCurrent').returns({ ID: 'mockedSiteID' });
            sinon.stub(File.prototype, 'exists').returns(false);

            const request = { httpParameterMap: { processMultipart: function (callback) { return callback(null, null, ''); } } };

            global.request = request;
            csvImportExportHelper.executeCsvImportExportJob.returns({
                success: true,
                executionObj: {}
            });

            executeCsvImportExportJob();
            assert.isTrue(Response.renderJSON.calledOnce, 'Response.renderJSON should be called once');
            assert.isTrue(Response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string
            }));
        });
    });
});
