'use strict';

const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const sinon = require('sinon');
const URLUtils = require('../../mock/dw/web/URLUtils');
const StringUtils = require('../../mock/dw/util/StringUtils');
const Resource = require('../../mock/dw/web/Resource');
const Logger = require('../../mock/dw/system/Logger');
const ISML = require('../../mock/dw/template/ISML');
const DW = require('../../mock/dw');
var Site = require('../../mock/dw/system/Site');
const { AppUtil } = require('../../mock/controllers');

var urlUtilsUrl;

describe('ConfigurationPage', function () {
    const response = { renderJSON: sinon.stub() };
    const configurationHelper = {
        isOciInventoryIntegrationMode: sinon.stub(),
        deleteMappingConfig: sinon.stub(),
        saveConfiguration: sinon.stub(),
        getLocationGraphExport: sinon.stub(),
        downloadLocationGraphExportFile: sinon.stub()
    };
    const ociInventoryHelper = { getGroupsAndLocations: sinon.stub() };
    const preferences = {};
    const originalRequest = global.request;
    const dateUtil = proxyquire('../../../cartridges/bm_itg_extension/cartridge/scripts/util/dateUtil.js', {
        'dw/system/Site': Site,
        'dw/system/System': DW.system.System,
        'dw/util/StringUtils': StringUtils
    });
    var { Start: start,
              DeleteDataMapping: deleteDataMapping,
              SaveConfiguration: saveConfiguration,
              DownloadOciLocations: downloadOciLocations
              } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/ConfigurationPage', {
                  'dw/template/ISML': ISML,
                  'dw/web/URLUtils': URLUtils,
                  'dw/web/Resource': Resource,
                  '*/cartridge/scripts/helpers/configurationHelper': configurationHelper,
                  '~/cartridge/config/preferences': preferences,
                  '~/cartridge/scripts/helpers/ociInventoryHelper.js': ociInventoryHelper,
                  '*/cartridge/scripts/util/responseUtil': response,
                  'dw/system/Logger': Logger,
                  '*/cartridge/scripts/util/app': AppUtil,
                  'dw/util/StringUtils': StringUtils,
                  'dw/util/Calendar': sinon.stub(),
                  '~/cartridge/scripts/util/dateUtil': dateUtil,
                  '~/cartridge/scripts/util/guard': {
                      ensure: (filters, action) => sinon.stub().callsFake(action)
                  }
              });

    beforeEach(function () {
        urlUtilsUrl = sinon.spy(URLUtils, 'https');
        global.empty = function (value) { return value == null || value === ''; };
        sinon.stub(ISML, 'renderTemplate');
        sinon.stub(Resource, 'msg');
    });

    afterEach(function () {
        sinon.restore();
        response.renderJSON.reset();
        urlUtilsUrl.restore();
        global.request = originalRequest;
    });

    it('should render the \'globalConfig/configuration\' template with the correct parameters', function () {
        const request = {
            httpQueryString: ''
        };
        global.request = request;
        configurationHelper.isOciInventoryIntegrationMode.returns(true);
        ociInventoryHelper.getGroupsAndLocations.returns({ downloadTime: '01/01/1970 00:00:00 am' });

        start();

        assert.strictEqual(ISML.renderTemplate.calledOnce, true);
        assert.strictEqual(ISML.renderTemplate.calledWith('globalConfig/configuration', {
            exportDetailsURL: urlUtilsUrl('ExecutionList-GetExecutionDetails'),
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
                    url: urlUtilsUrl('SiteNavigationBar-ShowSiteOverview')
                },
                {
                    htmlValue: Resource.msg('breadcrumb.site.preferences.title', 'common', null),
                    url: urlUtilsUrl('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'site-prefs')
                },
                {
                    htmlValue: Resource.msg('feature.title', 'configuration', null)
                }
            ],
            preferences: preferences,
            dataMapURL: urlUtilsUrl('CSVImportExport-DataMapping'),
            deleteMapUrl: urlUtilsUrl('ConfigurationPage-DeleteDataMapping'),
            saveConfigurationUrl: urlUtilsUrl('ConfigurationPage-SaveConfiguration'),
            ociConfigs: {
                isOciInventoryIntegrationMode: configurationHelper.isOciInventoryIntegrationMode(),
                locationsDownloadTime: 'formattedCalendar formattedCalendar',
                syncOciLocationsUrl: urlUtilsUrl('ConfigurationPage-DownloadOciLocations')
            }
        }), true);

        configurationHelper.isOciInventoryIntegrationMode.reset();
        ociInventoryHelper.getGroupsAndLocations.reset();
    });

    it('should catch any errors that occur during rendering globalConfig template', function () {
        configurationHelper.isOciInventoryIntegrationMode.throws(new Error('An error occurred'));
        const request = {
            httpQueryString: 'testQueryString'
        };
        global.request = request;

        start();

        assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
            breadcrumbs: sinon.match.array,
            message: sinon.match.string,
            currentUrl: sinon.match.string
        }));

        configurationHelper.isOciInventoryIntegrationMode.reset();
    });

    it('should deleteMappingConfig with correct arguments and render JSON response', function () {
        AppUtil.getRequestFormOrParams.returns({
            mappingId: 'testMappingId',
            type: 'testType',
            processType: 'testProcessType'
        });
        const deleteMappingConfigStub = configurationHelper.deleteMappingConfig.returns({ success: true });

        deleteDataMapping();

        sinon.assert.calledOnce(AppUtil.getRequestFormOrParams);
        sinon.assert.calledOnce(deleteMappingConfigStub);
        sinon.assert.calledWithExactly(deleteMappingConfigStub, 'testType-testProcessType', 'testMappingId');
        sinon.assert.calledWithExactly(response.renderJSON, { success: true });

        AppUtil.getRequestFormOrParams.reset();
        configurationHelper.deleteMappingConfig.reset();
    });

    it('should saveConfiguration with params and render JSON response', function () {
        AppUtil.getRequestFormOrParams.returns({ /* mock params */ });
        const saveConfigurationStub = configurationHelper.saveConfiguration.returns({ success: true });

        saveConfiguration(response);

        assert.isTrue(AppUtil.getRequestFormOrParams.calledOnce);
        assert.isTrue(saveConfigurationStub.calledOnce);
        assert.deepEqual(saveConfigurationStub.firstCall.args[0], { /* mock params */ });
        assert.isTrue(response.renderJSON.calledOnce);
        assert.deepEqual(response.renderJSON.firstCall.args[0], { success: true });

        AppUtil.getRequestFormOrParams.reset();
        configurationHelper.saveConfiguration.reset();
    });

    it('should render JSON with error message if saveConfiguration fails', function () {
        AppUtil.getRequestFormOrParams.returns({ /* mock params */ });
        const saveConfigurationStub = configurationHelper.saveConfiguration.returns({ success: false });
        Resource.msg.withArgs('error.technical', 'common', null).returns('mocked error message');

        saveConfiguration(response);

        assert.isTrue(AppUtil.getRequestFormOrParams.calledOnce);
        assert.isTrue(saveConfigurationStub.calledOnce);
        assert.deepEqual(saveConfigurationStub.firstCall.args[0], { /* mock params */ });
        assert.isTrue(response.renderJSON.calledOnce);
        assert.deepEqual(response.renderJSON.firstCall.args[0], { success: false, errorMessage: 'mocked error message' });

        AppUtil.getRequestFormOrParams.reset();
        configurationHelper.saveConfiguration.reset();
    });

    it('should return a success response when exportId is provided', function () {
        configurationHelper.getLocationGraphExport.returns({ data: { exportId: 'dummyExportId' } });
        configurationHelper.downloadLocationGraphExportFile.returns({ success: true, responseJSON: {} });
        AppUtil.getRequestFormOrParams.returns({ exportId: 'dummyExportId' });

        downloadOciLocations();

        sinon.assert.calledOnce(response.renderJSON);
        assert.deepEqual(response.renderJSON.args[0][0], { success: true, responseJSON: {} });

        AppUtil.getRequestFormOrParams.reset();
        configurationHelper.getLocationGraphExport.reset();
        configurationHelper.downloadLocationGraphExportFile.reset();
    });

    it('should return an success response when exportId is not provided', function () {
        configurationHelper.getLocationGraphExport.returns({ data: { exportId: 'dummyExportId' }, error: false });
        configurationHelper.downloadLocationGraphExportFile.returns({ success: true, responseJSON: {} });
        AppUtil.getRequestFormOrParams.returns({});

        downloadOciLocations();

        sinon.assert.calledOnce(response.renderJSON);
        assert.deepEqual(response.renderJSON.args[0][0], { success: true, responseJSON: {} });

        configurationHelper.getLocationGraphExport.reset();
        configurationHelper.downloadLocationGraphExportFile.reset();
    });

    it('should handle the case when ociExportResponse.data contains an error message', function () {
        configurationHelper.getLocationGraphExport.returns({ data: { errorMessage: 'An error occurred' }, error: true });
        configurationHelper.downloadLocationGraphExportFile.returns({ success: true, responseJSON: {} });
        AppUtil.getRequestFormOrParams.returns({});

        downloadOciLocations();

        sinon.assert.calledOnce(response.renderJSON);
        assert.deepEqual(response.renderJSON.args[0][0], {
            success: false,
            responseJSON: {},
            serverErrors: ['An error occurred']
        });

        configurationHelper.getLocationGraphExport.reset();
        configurationHelper.downloadLocationGraphExportFile.reset();
    });

    it('should handle the case when ociExportResponse contains an error message', function () {
        configurationHelper.getLocationGraphExport.returns({ errorMessage: 'An error occurred', error: true });
        configurationHelper.downloadLocationGraphExportFile.returns({ success: true, responseJSON: {} });
        AppUtil.getRequestFormOrParams.returns({});

        downloadOciLocations();

        sinon.assert.calledOnce(response.renderJSON);
        assert.deepEqual(response.renderJSON.args[0][0], {
            success: false,
            responseJSON: {},
            serverErrors: ['An error occurred']
        });

        configurationHelper.getLocationGraphExport.reset();
        configurationHelper.downloadLocationGraphExportFile.reset();
    });

    it('should handle the error occurred when exportId is not provided', function () {
        configurationHelper.getLocationGraphExport.returns({ error: true });
        configurationHelper.downloadLocationGraphExportFile.returns({ success: true, responseJSON: {} });
        AppUtil.getRequestFormOrParams.returns({});

        downloadOciLocations();

        sinon.assert.calledOnce(response.renderJSON);
        assert.deepEqual(response.renderJSON.args[0][0], {
            success: false,
            responseJSON: {},
            serverErrors: [Resource.msg('error.technical', 'common', null)]
        });

        configurationHelper.getLocationGraphExport.reset();
        configurationHelper.downloadLocationGraphExportFile.reset();
    });
});

