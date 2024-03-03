'use strict';

/**
 * @namespace ConfigurationController
*/
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var configurationHelper = require('*/cartridge/scripts/helpers/configurationHelper');
var preferences = require('~/cartridge/config/preferences');
var response = require('*/cartridge/scripts/util/responseUtil');
var app = require('*/cartridge/scripts/util/app');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var guard = require('~/cartridge/scripts/util/guard');
var ociInventoryHelper = require('~/cartridge/scripts/helpers/ociInventoryHelper.js');

/**
 * Show the main page
 */
function start() {
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowSiteOverview')
        },
        {
            htmlValue: Resource.msg('breadcrumb.site.preferences.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'site-prefs')
        },
        {
            htmlValue: Resource.msg('feature.title', 'configuration', null)
        }
    ];
    try {
        var dataMapURL = URLUtils.https('CSVImportExport-DataMapping');
        var deleteMapUrl = URLUtils.https('ConfigurationPage-DeleteDataMapping');
        var saveConfigurationUrl = URLUtils.https('ConfigurationPage-SaveConfiguration');

        var ociConfigs = {};
        ociConfigs.isOciInventoryIntegrationMode = configurationHelper.isOciInventoryIntegrationMode();
        if (ociConfigs.isOciInventoryIntegrationMode) {
            ociConfigs.locationsDownloadTime = ociInventoryHelper.getGroupsAndLocations().downloadTime;
            ociConfigs.syncOciLocationsUrl = URLUtils.https('ConfigurationPage-DownloadOciLocations');
        }


        ISML.renderTemplate('globalConfig/configuration', {
            exportDetailsURL: URLUtils.https('ExecutionList-GetExecutionDetails'),
            breadcrumbs: breadcrumbs,
            preferences: preferences,
            dataMapURL: dataMapURL,
            deleteMapUrl: deleteMapUrl,
            saveConfigurationUrl: saveConfigurationUrl,
            ociConfigs: ociConfigs
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('ConfigurationPage-Start').toString(), request.httpQueryString)
        });
    }
}
/**
 * Delete data mapping
 */
function deleteDataMapping() {
    var params = app.getRequestFormOrParams();
    var mappingId = params.mappingId;
    var type = params.type;
    var processType = params.processType;
    var mappingType = type + '-' + processType;
    var result = configurationHelper.deleteMappingConfig(mappingType, mappingId);
    response.renderJSON(result);
}

/**
 * Save configuration
 */
function saveConfiguration() {
    var params = app.getRequestFormOrParams();
    var result = configurationHelper.saveConfiguration(params);
    if (!result.success) {
        result.errorMessage = Resource.msg('error.technical', 'common', null);
    }
    response.renderJSON(result);
}

/**
 * Download OCI groups and locations of the current organization.
 */
function downloadOciLocations() {
    var result = {
        success: false,
        responseJSON: {}
    };
    var params = app.getRequestFormOrParams();
    var exportId = params.exportId || '';
    if (empty(exportId)) {
        var ociExportResponse = configurationHelper.getLocationGraphExport();
        if (!ociExportResponse.error) {
            exportId = ociExportResponse.data ? ociExportResponse.data.exportId : '';
        } else if (ociExportResponse.data && ociExportResponse.data.errorMessage) {
            result.serverErrors = [ociExportResponse.data.errorMessage];
        } else if (ociExportResponse && ociExportResponse.errorMessage) {
            result.serverErrors = [ociExportResponse.errorMessage];
        } else {
            result.serverErrors = [Resource.msg('error.technical', 'common', null)];
        }
    }
    if (!empty(exportId)) {
        result = configurationHelper.downloadLocationGraphExportFile(exportId);
    }
    response.renderJSON(result);
}

/** Renders the landing page of "BM Extension Configuration" module.
 * @see module:controllers/ConfigurationPage~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Deletes a data mapping.
 * @see module:controllers/ConfigurationPage~DeleteDataMapping */
exports.DeleteDataMapping = guard.ensure(['https', 'post', 'csrf'], deleteDataMapping);
/** Saves a data configuration.
 * @see module:controllers/ConfigurationPage~SaveConfiguration */
exports.SaveConfiguration = guard.ensure(['https', 'post', 'csrf'], saveConfiguration);
/** Download OCI groups and locations of the current organization.
 * @see module:controllers/ConfigurationPage~DownloadOciLocations */
exports.DownloadOciLocations = guard.ensure(['https', 'get', 'csrf'], downloadOciLocations);
