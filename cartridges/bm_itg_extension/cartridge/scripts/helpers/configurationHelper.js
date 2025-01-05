'use strict';
var currentSite = require('dw/system/Site').getCurrent();
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');
var File = require('dw/io/File');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var constants = require('~/cartridge/scripts/helpers/constants');
var oci = require('~/cartridge/scripts/util/oci.js');
var preferencesHelper = require('*/cartridge/scripts/helpers/preferencesHelper');
var ociEnums = require('*/cartridge/scripts/util/ociUtils/ociEnums');
var dateUtil = require('~/cartridge/scripts/util/dateUtil');


/**
 * Deletes a mapping configuration from custom objects in the Salesforce Commerce Cloud system.
 *
 * @param {string} type - The type associated with the mapping configuration.
 * @param {string} mappingId - The identifier for the mapping configuration.
 * @returns {Object} - An object indicating the success of the deletion operation with a 'success' property.
 */
function deleteMappingConfig(type, mappingId) {
    var mappingName = StringUtils.format('{0}-{1}-{2}', currentSite.ID, type, mappingId);

    var mappingConfig = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, mappingName);
    var result = {
        success: false
    };
    if (!empty(mappingConfig)) {
        Transaction.wrap(function () {
            CustomObjectMgr.remove(mappingConfig);
        });
        result.success = true;
    }

    return result;
}

/**
 * Retrieves saved mapping configurations of a specific type from custom objects in the Salesforce Commerce Cloud system.
 *
 * @param {string} type - The type associated with the saved mapping configurations.
 * @param {string} mappingId - The identifier for the mapping configuration.
 * @returns {Object} - An object representing a saved mapping configuration, including mappingName, mappingObject, and mappingId.
 */
function getDataMapping(type, mappingId) {
    var mappingName = StringUtils.format('{0}-{1}-{2}', currentSite.ID, type, mappingId);
    var dataMapping = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, mappingName);

    return dataMapping;
}

/**
 * Converts a JSON object into an array of keys and an array of values.
 *
 * @param {Object} jsonObject - The JSON object to be converted.
 * @returns {Array} - An array containing two sub-arrays: keysArray and valuesArray.
 */
function convertJsonToArray(jsonObject) {
    var keysArray = [];
    if (!empty(jsonObject)) {
        keysArray = jsonObject.map(function (obj) {
            return Object.keys(obj).map(function (key) {
                var value = obj[key];
                return [key, value];
            });
        });
    }
    return keysArray;
}

/**
 * Saves configuration parameters as preferences in the Salesforce Commerce Cloud system.
 *
 * @param {Object} params - An object containing configuration parameters to be saved as preferences.
 * @returns {Object} results
*/
function saveConfiguration(params) {
    var configParams = params;
    var result = {
        success: false
    };
    try {
        if ('csrf_token' in configParams) {
            delete configParams.csrf_token;
        }
        if (!empty(configParams)) {
            Object.keys(configParams).forEach(function (key) {
                preferencesHelper.setPreferenceValue(key, configParams[key]);
            });
            result = {
                success: true
            };
        }
    } catch (e) {
        Logger.error(Resource.msgf('preference.value.error', 'configuration', null, e.message));
    }

    return result;
}

/**
 * Exports the entire location graph for the current organization.
 * @returns {Object} ociResponse
 */
function getLocationGraphExport() {
    var ociResponse = new oci.RequestBuilder()
        .setOciAction(ociEnums.ENDPOINTS.GET_LOCATION_GRAPG_EXPORT)
        .execute();

    return ociResponse;
}

/**
 * Download the generated location graph export file.
 * @param {string} exportId - Export ID.
 * @returns {Object} result
 */
function downloadLocationGraphExportFile(exportId) {
    var result = {
        success: false,
        responseJSON: {}
    };
    var DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE = ociEnums.ENDPOINTS.DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE;
    DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE.api = StringUtils.format(DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE.api, exportId);
    var ociDownloadResponse = new oci.RequestBuilder()
        .setOciAction(DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE)
        .execute();

    if (!ociDownloadResponse.error) {
        if (ociDownloadResponse && ociDownloadResponse.data) {
            var content = ociDownloadResponse.data;
            var commonHelper = require('~/cartridge/scripts/helpers/commonFileHelper.js');
            var groupsAndLocationsPath = constants.OMNI_CHANNEL_INVENTORY.IMPEX_PATH + constants.OMNI_CHANNEL_INVENTORY.GROUPS_AND_LOCATIONS_FOLDER;
            var startDate = new Date();
            content.downloadTime = startDate.toUTCString();
            var impexPath = File.IMPEX + '/src' + groupsAndLocationsPath;
            var fileName = constants.OMNI_CHANNEL_INVENTORY.GROUPS_AND_LOCATIONS_FILE;
            commonHelper.createFileInImpex(JSON.stringify(content), impexPath, fileName, '');
            result.success = true;
            startDate = dateUtil.convertUTCToSiteTimezone(startDate);
            var calendar = new Calendar(startDate);
            var ociDownloadFormattedDate = StringUtils.formatCalendar(calendar, request.locale, Calendar.INPUT_DATE_PATTERN);
            var ociDownloadFormattedTime = StringUtils.formatCalendar(calendar, request.locale, Calendar.TIME_PATTERN);
            result.responseJSON.locationsDownloadTime = ociDownloadFormattedDate + ' ' + ociDownloadFormattedTime;
            result.responseJSON.exportCompleted = true;
        }
    } else if (ociDownloadResponse.errorCode === '409') {
        result.success = true;
        result.responseJSON.exportCompleted = false;
        result.responseJSON.exportId = exportId;
    } else if (ociDownloadResponse.data && ociDownloadResponse.data.errorMessage) {
        result.serverErrors = [ociDownloadResponse.data.errorMessage];
    } else if (ociDownloadResponse && ociDownloadResponse.errorMessage) {
        result.serverErrors = [ociDownloadResponse.errorMessage];
    } else {
        result.serverErrors = [Resource.msg('error.technical', 'common', null)];
    }

    return result;
}

/**
 * Returns true if the inventory integration mode is related to OCI
 *
 * @returns {boolean} isOciIntegrationMode.
 */
function isOciInventoryIntegrationMode() {
    var isOciIntegrationMode = false;
    var InventoryIntegrationMode = ProductInventoryMgr.getInventoryIntegrationMode();
    if (InventoryIntegrationMode === ProductInventoryMgr.INTEGRATIONMODE_OCI_CACHE || InventoryIntegrationMode === ProductInventoryMgr.INTEGRATIONMODE_OCI) {
        isOciIntegrationMode = true;
    }
    return isOciIntegrationMode;
}

module.exports = {
    deleteMappingConfig: deleteMappingConfig,
    getDataMapping: getDataMapping,
    convertJsonToArray: convertJsonToArray,
    saveConfiguration: saveConfiguration,
    downloadLocationGraphExportFile: downloadLocationGraphExportFile,
    isOciInventoryIntegrationMode: isOciInventoryIntegrationMode,
    getLocationGraphExport: getLocationGraphExport
};
