'use strict';

/**
 * @namespace CSVImportExport
 */

var ISML = require('dw/template/ISML');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var ArrayList = require('dw/util/ArrayList');
var File = require('dw/io/File');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var csvImportExportHelper = require('*/cartridge/scripts/helpers/csvImportExportHelper');
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var responseUtil = require('*/cartridge/scripts/util/responseUtil');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var constants = require('*/cartridge/scripts/helpers/constants');
var configurationHelper = require('*/cartridge/scripts/helpers/configurationHelper');
var app = require('*/cartridge/scripts/util/app');
var guard = require('~/cartridge/scripts/util/guard');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');


/**
 * Show the main page
 */
function start() {
    var params = app.getRequestFormOrParams();
    var currentMenuItem = params.CurrentMenuItemId;
    var messageDescription = Resource.msg('import.export.description.' + currentMenuItem, 'csvImportExport', null);
    var breadcrumbUrl;
    var title;
    if (currentMenuItem === constants.CSV_IMPORT_EXPORT.PRODUCT_MENU) {
        messageDescription = Resource.msg('import.export.description.product', 'csvImportExport', null);
        breadcrumbUrl = URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'prod-cat');
        title = Resource.msg('breadcrumb.products.catalogs.title', 'common', null);
    } else if (currentMenuItem === constants.CSV_IMPORT_EXPORT.CUSTOMER_MENU) {
        breadcrumbUrl = URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'customers');
        title = Resource.msg('breadcrumb.products.customers.title', 'common', null);
    } else if (currentMenuItem === constants.CSV_IMPORT_EXPORT.MARKETING_MENU) {
        title = Resource.msg('breadcrumb.online.marketing.title', 'common', null);
        breadcrumbUrl = URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'marketing');
    }

    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowSiteOverview')
        },
        {
            htmlValue: title,
            url: breadcrumbUrl
        },
        {
            htmlValue: Resource.msg('breadcrumb.csv.import.export.title', 'csvImportExport', null)
        }
    ];
    try {
        var dataMapURL = URLUtils.https('CSVImportExport-DataMapping');
        var jobIds = [constants.CSV_IMPORT_EXPORT.JOB_ID];
        var executeCsvImportExport = URLUtils.https('CSVImportExport-ExecuteCsvImportExportJob');

        var invalidFileType = Resource.msg('import.export.upload.file.error.message', 'csvImportExport', null);

        var executionListResult = jobServicesHelper.getRecentProcessList(jobIds, constants.CSV_IMPORT_EXPORT.RECENT_PROCESSES_NUMBER, true, 'csv', constants.CSV_IMPORT_EXPORT.IMPEX_PATH);
        var isOciInventoryIntegrationMode = configurationHelper.isOciInventoryIntegrationMode();
        if (executionListResult.success) {
            var result = {
                messageDescription: messageDescription,
                dataMapURL: dataMapURL.toString(),
                currentMenuItem: currentMenuItem,
                invalidFileType: invalidFileType,
                executionList: executionListResult.executionList,
                executionListData: {
                    exportDetailsURL: URLUtils.https('ExecutionList-GetExecutionDetails').toString(),
                    showDownloadFile: true,
                    downloadFileType: 'csv',
                    impexPath: constants.CSV_IMPORT_EXPORT.IMPEX_PATH,
                    maxProcessNumber: constants.CSV_IMPORT_EXPORT.RECENT_PROCESSES_NUMBER,
                    serviceType: Resource.msg('service.type', 'csvImportExport', null),
                    jobIds: jobIds
                },
                actionUrl: executeCsvImportExport,
                breadcrumbs: breadcrumbs,
                isOciInventoryIntegrationMode: isOciInventoryIntegrationMode
            };

            if (currentMenuItem === constants.CSV_IMPORT_EXPORT.PRODUCT_MENU) {
                result = csvImportExportHelper.addPriceAndInventoryData(result);
            }

            if (result.error) {
                ISML.renderTemplate('common/errorPage', {
                    breadcrumbs: breadcrumbs,
                    message: result.data.errorMessage,
                    currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('CSVImportExport-Start').toString(), request.httpQueryString)
                });
            } else {
                ISML.renderTemplate('csvImportExport/csvImportExport', result);
            }
        } else {
            Logger.error(Resource.msgf('render.page.error', 'error', null, executionListResult.errorMessage));
            ISML.renderTemplate('common/errorPage', {
                breadcrumbs: breadcrumbs,
                message: executionListResult.errorMessage,
                currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('CSVImportExport-Start').toString(), request.httpQueryString)
            });
        }
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('CSVImportExport-Start').toString(), request.httpQueryString)
        });
    }
}

/**
 * Show data map modal
 */
function dataMapping() {
    var params = app.getRequestFormOrParams();
    var type = params.type;
    var processType = params.processType;
    var mappingType = type + '-' + processType;
    var editMode = params.editMode;
    var result;
    try {
        var mappingConfigurationURL = URLUtils.https('CSVImportExport-NewMappingConfiguration');
        var savedMappingArray = csvImportExportHelper.getSavedMappingObj(mappingType);
        var resultTemplate = 'csvImportExport/dataMapping';
        var schema = csvImportExportHelper.getSchemaData(type);
        var systemAttribute = schema && schema.attributes ? JSON.stringify(schema.attributes) : '';
        var resultContext = {
            actionUrl: mappingConfigurationURL.toString(),
            savedMappingArray: savedMappingArray,
            editMode: editMode,
            systemAttribute: systemAttribute
        };
        var renderedTemplate = renderTemplateHelper.getRenderedHtml(
            resultContext,
            resultTemplate
        );
        result = {
            success: true,
            renderedTemplate: renderedTemplate
        };
    } catch (e) {
        result = {
            success: false,
            errorMessage: e.message
        };
        Logger.error(Resource.msgf('error.data.map', 'csvImportExport', null, e.message));
    }
    responseUtil.renderJSON(result);
}

/**
 * Create new map configuration
 */
function newMappingConfiguration() {
    var saveMappingURL = URLUtils.https('CSVImportExport-SaveMappingConfiguration');
    var params = app.getRequestFormOrParams();
    var type = params.type;
    var processType = params.processType;
    var mappingType = type + '-' + processType;
    var editMode = params.editMode;
    var resultContext;
    var renderedTemplate;
    var resultTemplate = 'csvImportExport/newMappingConfiguration';
    var schema = csvImportExportHelper.getSchemaData(type);
    var result = {
        success: false
    };
    try {
        if (editMode && schema && schema.attributes) {
            var mappingId = params.mappingId;
            var dataMappingObj = csvImportExportHelper.getDataMapping(mappingType, mappingId);
            var mappingObj = dataMappingObj.custom && dataMappingObj.custom.mappingJson ? JSON.parse(dataMappingObj.custom.mappingJson) : {};
            var keyValueArray = configurationHelper.convertJsonToArray(mappingObj);
            var disableAddition = false;
            if (keyValueArray.length === Object.keys(schema.attributes).length) {
                disableAddition = true;
            }
            resultContext = {
                actionUrl: saveMappingURL.toString(),
                keyValueArray: keyValueArray,
                editMode: editMode,
                systemAttribute: JSON.stringify(schema.attributes),
                savedMappingId: mappingId,
                processType: processType,
                disableAddition: disableAddition
            };
            renderedTemplate = renderTemplateHelper.getRenderedHtml(
                resultContext,
                resultTemplate
            );
            result = {
                renderedTemplate: renderedTemplate,
                success: true
            };
        } else if (schema && schema.attributes) {
            resultContext = {
                systemAttribute: JSON.stringify(schema.attributes),
                actionUrl: saveMappingURL.toString(),
                processType: processType
            };
            resultTemplate = 'csvImportExport/newMappingConfiguration';
            renderedTemplate = renderTemplateHelper.getRenderedHtml(
                resultContext,
                resultTemplate
            );
            result.renderedTemplate = renderedTemplate;
            result.success = true;
        } else {
            result.errorMessage = Resource.msg('import.export.mapping.name.error', 'csvImportExport', null);
        }
    } catch (e) {
        result.errorMessage = e.message;
        Logger.error(Resource.msgf('new.map.config.error', 'csvImportExport', null, e.message));
    }

    responseUtil.renderJSON(result);
}

/**
 * Save mapping configration
 */
function saveMappingConfiguration() {
    var result = {
        success: true
    };
    try {
        var mappingConfigData = app.getRequestFormOrParams();
        var objectAttr = mappingConfigData.objectAttr ? new ArrayList(mappingConfigData.objectAttr) : [];
        var csvAttr = mappingConfigData.csvAttr ? new ArrayList(mappingConfigData.csvAttr) : [];
        var mappingName = mappingConfigData.mappingName;
        var type = mappingConfigData.mappingId;
        var processType = mappingConfigData.processType;
        var mappingType = type + '-' + processType;
        var editMode = mappingConfigData.editMode || false;
        if (processType === 'Import') {
            result = csvImportExportHelper.validateMappingAttrs(objectAttr, type);
        } else if (processType === 'Export') {
            if (empty(mappingConfigData.objectAttr) || empty(mappingConfigData.csvAttr)) {
                result = {
                    success: false,
                    errorMessage: Resource.msg('export.min.mapping.length', 'csvImportExport', null)
                };
            }
        }
        if (result.success) {
            if (empty(result.missedMandatoryAttributes) && empty(result.missedMandatoryIfOtherExist)) {
                var mappingConfig = csvImportExportHelper.createCustomObj(objectAttr, csvAttr, mappingName, mappingType, editMode);
                if (!empty(mappingConfig)) {
                    result.success = true;
                    result.responseJSON = {
                        newMappingName: mappingName
                    };
                } else {
                    result = {
                        success: false,
                        errorMessage: Resource.msg('import.export.mapping.name.error', 'csvImportExport', null)
                    };
                }
            } else if (!empty(result.missedMandatoryIfOtherExist)) {
                result.errorMessage = Resource.msg('import.export.missing.mandatory.if.exist', 'csvImportExport', null);
            }
        }
    } catch (e) {
        result.errorMessage = e.message;
        Logger.error(Resource.msgf('save.map.config.error', 'csvImportExport', null, e.message));
    }

    responseUtil.renderJSON(result);
}


/**
 * To execute the CSV Import & Export job
 * @returns {Object} - Object representing the job execution result
 */
function executeCsvImportExportJob() {
    var importFormData = app.getRequestFormOrParams();
    var currentSite = Site.getCurrent();
    var filePath;
    var fileName = null;
    var dataType = importFormData.dataType;
    var processType = importFormData.processType;
    var jobResponse;
    var mappingConfig;
    var result = {
        success: false
    };
    try {
        request.httpParameterMap.processMultipart((function (field, ct, oname) {
            var folderPath = StringUtils.format('{0}/src/bm-extension/CSV_IMPEX/{1}/Import/CSV/', File.IMPEX, currentSite.ID);
            var csvFolder = new File(folderPath);
            if (!csvFolder.exists()) {
                csvFolder.mkdirs();
            }
            filePath = folderPath + oname;
            return new File(filePath);
        }));
        if (!empty(importFormData.dataMappingName)) {
            var mappingName = StringUtils.format('{0}-{1}-{2}-{3}', currentSite.ID, dataType, processType, importFormData.dataMappingName);
            mappingConfig = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, mappingName);
        }
        if ((processType === 'Import' && empty(filePath)) ||
            empty(dataType) ||
            (dataType === constants.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK && empty(importFormData.priceBookId)) ||
            (dataType === constants.CSV_IMPORT_EXPORT.DATA_TYPES.INVENTORY && empty(importFormData.inventoryId)) ||
            empty(importFormData.dataMappingName) || empty(mappingConfig)) {
            result.errorMessage = Resource.msg('import.export.data.missing.error', 'csvImportExport', null);
            return responseUtil.renderJSON(result);
        }
        if (!empty(filePath)) {
            var match = filePath.match(/\/([^/]+)$/);
            fileName = match ? match[1] : null;
        }

        if (!empty(fileName) && fileName.indexOf('.csv', fileName.length - '.csv'.length) === -1) {
            result = {
                success: false,
                errorMessage: Resource.msg('import.export.upload.file.error.message', 'csvImportExport', null)
            };
            return responseUtil.renderJSON(result);
        }

        jobResponse = csvImportExportHelper.executeCsvImportExportJob(importFormData, fileName);

        if (jobResponse.success && jobResponse.executionObj && !jobResponse.executionObj.error) {
            var resultContext = {
                executionListData: {
                    showDownloadFile: true,
                    downloadFileType: 'csv',
                    serviceType: Resource.msg('service.type', 'csvImportExport', null)
                },
                executionDetails: jobResponse.executionObj
            };
            var resultTemplate = 'executionHistory/executionRow';
            var renderedTemplate = renderTemplateHelper.getRenderedHtml(
                resultContext,
                resultTemplate
            );
            result = {
                success: true,
                renderedTemplate: renderedTemplate
            };
        } else if (jobResponse.executionObj && jobResponse.executionObj.data && jobResponse.executionObj.data.errorMessage) {
            result = {
                success: false,
                errorMessage: jobResponse.executionObj.data.errorMessage
            };
        }
    } catch (e) {
        Logger.error(Resource.msgf('execute.csv.import.export.error', 'csvImportExport', null, e.message));
        result.errorMessage = e.message;
    }

    return responseUtil.renderJSON(result);
}

/** Renders the landing page of "CSV Import & Export" module.
 * @see module:controllers/CSVImportExport~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Gets the saved mappings.
 * @see module:controllers/CSVImportExport~DataMapping */
exports.DataMapping = guard.ensure(['https', 'get', 'csrf'], dataMapping);
/** Gets the list of attributes needed to create a new mapping configuration for an object type.
 * @see module:controllers/CSVImportExport~NewMappingConfiguration */
exports.NewMappingConfiguration = guard.ensure(['https', 'get', 'csrf'], newMappingConfiguration);
/** Saves a mapping configuration for an object type.
 * @see module:controllers/CSVImportExport~SaveMappingConfiguration */
exports.SaveMappingConfiguration = guard.ensure(['https', 'post', 'csrf'], saveMappingConfiguration);
/** Executes CSV Import/Export process based on the user selections.
 * @see module:controllers/CSVImportExport~ExecuteCsvImportExportJob */
exports.ExecuteCsvImportExportJob = guard.ensure(['https', 'post', 'csrf'], executeCsvImportExportJob);

