'use strict';
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var ocapi = require('~/cartridge/scripts/util/ocapi');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var constants = require('~/cartridge/scripts/helpers/constants');
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var Resource = require('dw/web/Resource');

/**
 * Creates a mapping object from a list of mapping items.
 * @param {Array} objectAttr - The array containing keys (attributes) for the mapping object.
 * @param {Array} csvAttr - The array containing values corresponding to the keys for the mapping object.
 * @returns {Object} - The mapping object with keys and values from the input arrays.
 */
function createMappingObject(objectAttr, csvAttr) {
    var mappingArray = [];
    if (objectAttr.length) {
        for (let i = 0; i < objectAttr.length; i++) {
            var mappingObj = {};
            var key = objectAttr[i];
            var value = csvAttr[i];
            mappingObj[key] = value;
            mappingArray.push(mappingObj);
        }
    }
    return mappingArray;
}

/**
 * Creates a custom object in the Demandware/Salesforce Commerce Cloud system based on provided parameters.
 * If a custom object with the same name already exists, it updates the mappingObject attribute.
 *
 * @param {Array} objectAttr - The array containing keys (attributes) for the mapping object.
 * @param {Array} csvAttr - The array containing values corresponding to the keys for the mapping object.
 * @param {string} mappingName - The name associated with the custom object and used for identification.
 * @param {string} type - The type of custom object to create.
 * @param {boolean} editMode -Indicates whether the function is called in edit mode. Default is false.
 * @returns {Object} - The created or updated custom object representing the mapping.
 */
function createCustomObj(objectAttr, csvAttr, mappingName, type, editMode) {
    var currentSite = Site.getCurrent();
    var Transaction = require('dw/system/Transaction');
    var mappingObj = createMappingObject(objectAttr, csvAttr);
    var mappingConfigObj;
    if (!empty(mappingObj)) {
        var name = StringUtils.format('{0}-{1}-{2}', currentSite.ID, type, mappingName);

        var mappingConfig = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, name);
        if (empty(mappingConfig)) {
            Transaction.wrap(function () {
                mappingConfigObj = CustomObjectMgr.createCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, name);
                mappingConfigObj.custom.mappingJson = JSON.stringify(mappingObj);
            });
        } else if (editMode) {
            Transaction.wrap(function () {
                mappingConfig.custom.mappingJson = JSON.stringify(mappingObj);
            });
            mappingConfigObj = mappingConfig;
        }
    }

    return mappingConfigObj;
}

/**
 * Extracts the substring after the second occurrence of a dash ("-") in the given input string.
 *
 * @param {string} type - Mapping type.
 * @param {string} inputString - The input string from which to extract the substring.
 * @returns {string} - The substring after the first dash, or the original string if no dash is found.
 */
function getMappingName(type, inputString) {
    var currentSite = Site.getCurrent();
    var textToBeRemoved = StringUtils.format('{0}-{1}-', currentSite.ID, type);
    var regExp = new RegExp(textToBeRemoved, 'g');
    return inputString.replace(regExp, '');
}

/**
 * Retrieves saved mapping configurations of a specific type from custom objects in the Salesforce Commerce Cloud system.
 *
 * @param {string} type - The type associated with the saved mapping configurations.
 * @returns {Array} - An array of objects, each representing a saved mapping configuration, including mappingName, mappingObject, and mappingId.
 */
function getSavedMappingObj(type) {
    var currentSite = Site.getCurrent();
    var searchTerm = StringUtils.format('{0}-{1}', currentSite.ID, type);
    var queryString = "custom.mappingId LIKE '".concat(searchTerm, "*'");
    var searchQuery = CustomObjectMgr.queryCustomObjects(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, queryString, null);
    var savedMappingArray = [];
    var savedMappingObj;

    while (searchQuery.hasNext()) {
        var savedMap = searchQuery.next();
        savedMappingObj = {
            mappingObject: savedMap.custom.mappingJson,
            mappingId: getMappingName(type, savedMap.custom.mappingId)
        };
        savedMappingArray.push(savedMappingObj);
    }
    return savedMappingArray;
}

/**
 * Retrieves attribute definitions for a given object type using the OCAPI (Open Commerce API) endpoint.
 *
 * @param {string} type - The type of the object for which attribute definitions are to be retrieved.
 * @returns {Object} - The OCAPI response containing attribute definitions for the specified object type.
 */
function getAttributeDefinitions(type) {
    var ocapiResponse = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.ATTRIBUTE_DEFINITIONS)
        .addParameters(type)
        .setPageSize(200)
        .execute();
    return ocapiResponse;
}

/**
 * Retrieves a list of inventory IDs using the OCAPI (Open Commerce API).
 *
 * @function
 * @returns {Array} - An array containing inventory data.);
 */
function getInventoryListId() {
    var ocapiResponse = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.INVENTORY_LIST)
        .setPageSize(200)
        .execute();
    var data = [];
    var index = 1;
    var ocapiBatchRequestData;
    var ocapiBatchRequest;
    if (!ocapiResponse.error && ocapiResponse.data && ocapiResponse.data.data && ocapiResponse.data.data.length) {
        data = data.concat(ocapiResponse.data.data);
        var ocapiResponseData = ocapiResponse.data;
        if (ocapiResponseData.count + ocapiResponseData.start < ocapiResponseData.total) {
            var inventoryListCount = Math.ceil(ocapiResponseData.total / ocapiResponseData.count);
            ocapiBatchRequest = new ocapi.BatchBuilder();
            for (index; index < inventoryListCount; index++) {
                ocapiBatchRequest.addRequest(new ocapi.RequestBuilder()
                    .setRequestId('inventory_' + index)
                    .setOcapi(ocapi.ENDPOINTS.INVENTORY_LIST)
                    .setPageSize(200)
                    .setPageNumber(index));
            }
            ocapiBatchRequestData = ocapiBatchRequest.execute();
            if (ocapiBatchRequestData.responseList) {
                var responseList = ocapiBatchRequestData.responseList;
                Object.keys(responseList).forEach(function (key) {
                    if (!responseList[key].error && responseList[key].data && responseList[key].data.data && responseList[key].data.data.length) {
                        data = data.concat(responseList[key].data.data);
                    } else {
                        Logger.error('Get inventory list IDs return an error: {0}', responseList[key].data.errorMessage);
                    }
                });
            }
        }
    } else {
        Logger.error('Get inventory list IDs return an error: {0}', ocapiResponse.data.errorMessage);
        data = null;
    }

    return data;
}

/**
 * Adds custom attributes to a given schema based on the provided parameters.
 *
 * @param {Object} schema - The original schema object.
 * @param {boolean} csvToXml - Indicates whether to perform a conversion from CSV to XML.
 * @param {Object} xmlSchema - The XML schema object.
 * @param {string} parentRecord - The name of the parent record in the schema.
 * @returns {Object} - The updated schema object with added custom attributes.
 */
function addCustomAttributes(schema, csvToXml, xmlSchema, parentRecord) {
    var schemaObj;
    if (schema && Object.keys(schema).length > 0) {
        var result = [];
        var requestCount = 1;
        var sendBatchRequest = false;
        schemaObj = schema;
        var ocapiBatchRequest = new ocapi.BatchBuilder();
        var attributeDefinitions = getAttributeDefinitions(schemaObj.ocapiSystemAttributeType);
        if (attributeDefinitions && attributeDefinitions.data && attributeDefinitions.data.data && attributeDefinitions.data.data.length) {
            attributeDefinitions.data.data.forEach(function (item) {
                if (schemaObj.systemAttributes.indexOf(item.id) === -1) {
                    if (csvToXml) {
                        ocapiBatchRequest.addRequest(new ocapi.RequestBuilder()
                                .setRequestId(item.id)
                                .setOcapi(ocapi.ENDPOINTS.SYSTEM_ATTRIBUTE_DETAILS)
                                .addParameters(schemaObj.ocapiSystemAttributeType, item.id));
                        requestCount++;
                        sendBatchRequest = true;
                        if (requestCount === 50 && sendBatchRequest) {
                            result = result.concat(ocapiBatchRequest.execute());
                            ocapiBatchRequest = new ocapi.BatchBuilder();
                            sendBatchRequest = false;
                            requestCount = 1;
                        }
                    } else {
                        schemaObj.attributes['custom.' + item.id] = {
                            displayName: item.id
                        };
                    }
                }
            });
            if (csvToXml) {
                schemaObj = xmlSchema;
                var customAttributeSchema = {
                    'custom-attributes': {
                        'elements': {
                            'custom-attribute': []
                        }
                    }
                };
                if (sendBatchRequest) {
                    var ocapiBatchRequestData = ocapiBatchRequest.execute();
                    result = result.concat(ocapiBatchRequestData);
                }
                var customAttributesArray = customAttributeSchema['custom-attributes'].elements['custom-attribute'];
                result.forEach(function (item) {
                    var attributes = Object.values(item.responseList);
                    attributes.forEach(function (attribute) {
                        var customAttributeObj = {
                            'attributes': {
                                'attribute-id': {
                                    'mappingAttributeKey': ''
                                }
                            },
                            'value': {
                                'mappingAttributeId': ''
                            },
                            'dataType': ''
                        };
                        customAttributeObj.attributes['attribute-id'].mappingAttributeKey = attribute.data.id;
                        customAttributeObj.value.mappingAttributeId = 'custom.' + attribute.data.id;
                        customAttributeObj.dataType = attribute.data.value_type;
                        customAttributesArray.push(customAttributeObj);
                    });
                });
                schemaObj.elements[parentRecord].elements['custom-attributes'] = customAttributeSchema['custom-attributes'];
            }
        }
    }

    return schemaObj;
}

/**
 * Retrieves schema data based on the specified import/export type.
 *
 * @param {string} type - The import/export type for which to retrieve schema data.
 * @returns {Array} - An array of key-value pairs representing the schema attributes, or undefined if the type is not recognized.
 */
function getSchemaData(type) {
    var schema;

    switch (type) {
        case constants.CSV_IMPORT_EXPORT.DATA_TYPES.INVENTORY:
            schema = require('*/cartridge/scripts/schemas/inventoryAttributes.json');
            break;
        case constants.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK:
            schema = require('*/cartridge/scripts/schemas/priceBookAttributes.json');
            break;
        default:
            break;
    }
    return addCustomAttributes(schema);
}


/**
 * Execute CSV import/export job.
 * @param {Object} params - Params.
 * @param {string} fileName - Import file name
 * @returns {Object} responseObj
 */
function executeCsvImportExportJob(params, fileName) {
    var currentSite = Site.getCurrent();
    var siteId = currentSite.ID;
    var dataType = params.dataType;
    var processType = params.processType;
    var result = {
        success: false
    };

    var cal = new Calendar();
    var timestamp = StringUtils.formatCalendar(cal, 'yyyyMMddHHmmss');
    var impexType;
    var objectId;
    var jobParams = {
        SiteScope: JSON.stringify({ named_sites: [siteId] }),
        ProcessType: processType,
        CSVFilePath: StringUtils.format('bm-extension/CSV_IMPEX/{0}/{1}/CSV', siteId, processType),
        ImportFileName: fileName || '-'
    };
    if (dataType === constants.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK) {
        impexType = 'price_book';
        var priceBookId;
        objectId = priceBookId = params.priceBookId;
        jobParams.PriceBookID = priceBookId;
        jobParams.DataMappingName = StringUtils.format('{0}-{1}-{2}-{3}', siteId, constants.CSV_IMPORT_EXPORT.DATA_TYPES.PRICEBOOK, processType, params.dataMappingName);
    } else if (dataType === constants.CSV_IMPORT_EXPORT.DATA_TYPES.INVENTORY) {
        impexType = 'inventory_list';
        var inventoryId;
        objectId = inventoryId = params.inventoryId;
        jobParams.InventoryID = inventoryId;
        jobParams.DataMappingName = StringUtils.format('{0}-{1}-{2}-{3}', siteId, constants.CSV_IMPORT_EXPORT.DATA_TYPES.INVENTORY, processType, params.dataMappingName);
    }
    jobParams.ObjectID = objectId;
    jobParams.ExportFileName = StringUtils.format('{0}_{1}.csv', objectId, timestamp);
    jobParams.OTBFilePath = StringUtils.format('bm-extension/CSV_IMPEX/{0}/{1}/XML/{2}/', siteId, processType, impexType);
    jobParams.XMLFilePath = StringUtils.format('/src/bm-extension/CSV_IMPEX/{0}/{1}/XML/{2}/', siteId, processType, impexType);
    jobParams.ImpexType = impexType;

    var jobResponse = jobServicesHelper.executeJob(constants.CSV_IMPORT_EXPORT.JOB_ID, jobParams, true, 'csv', constants.CSV_IMPORT_EXPORT.IMPEX_PATH);
    if (jobResponse) {
        result.success = true;
        result.executionObj = jobResponse;
    }
    return result;
}

function getDataMapping(type, mappingId) {
    var currentSite = Site.getCurrent();
    var mappingName = StringUtils.format('{0}-{1}-{2}', currentSite.ID, type, mappingId);
    var dataMapping = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, mappingName);

    return dataMapping;
}

/**
 * Add Price books and inventory details to the result
 * @param {Object} result - Current result to render in isml template
 * @returns {Object} result - Updated reesult
 */
function addPriceAndInventoryData(result) {
    var priceInventoryObj = result;
    var allPriceBooks = PriceBookMgr.getAllPriceBooks();
    var inventoryListIds = getInventoryListId();
    if (!empty(allPriceBooks)) {
        priceInventoryObj.allPriceBooks = allPriceBooks;
    }
    if (!empty(inventoryListIds)) {
        priceInventoryObj.inventoryListIds = inventoryListIds;
    }
    return priceInventoryObj;
}

/**
 * Add Price books and inventory details to the result
 * @param {dw.util.ArrayList} objectAttr - List of mapping attributes.
 * @param {string} type - Type of mapping.
 * @returns {Object} result
 */
function validateMappingAttrs(objectAttr, type) {
    var result = {
        success: true
    };
    if (objectAttr.length < constants.CSV_IMPORT_EXPORT.MIN_MAPPING_LENGTH) {
        result = {
            success: false,
            errorMessage: Resource.msg('import.export.min.mapping.length', 'csvImportExport', null)
        };
    } else {
        var schema = getSchemaData(type);
        var missedMandatoryAttributes = [];
        Object.keys(schema.attributes).forEach(function (attr) {
            var attrRule = schema.attributes[attr].rules ? schema.attributes[attr].rules : null;
            if (!empty(attrRule)) {
                if (attrRule.mandatory && objectAttr.indexOf(attr) === -1) {
                    missedMandatoryAttributes.push(Resource.msgf('import.export.mandatory.if.exist', 'csvImportExport', null, schema.attributes[attr].displayName));
                } else if (attrRule.mandatoryIfAnyExists && objectAttr.indexOf(attr) !== -1) {
                    var mandatoryAttrs = [];
                    for (var i = 0; i < attrRule.mandatoryIfAnyExists.length; i++) {
                        var mandatoryAttr = attrRule.mandatoryIfAnyExists[0];
                        if (objectAttr.indexOf(mandatoryAttr) === -1) {
                            mandatoryAttrs.push(schema.attributes[mandatoryAttr].displayName);
                        }
                    }
                    if (mandatoryAttrs.length > 0) {
                        result = {
                            success: false,
                            missedMandatoryIfOtherExist: [{
                                attrId: attr,
                                errorMessage: Resource.msgf('import.export.mandatory.if.exist', 'csvImportExport', null, mandatoryAttrs[0])
                            }]
                        };
                    }
                }
            }
        });
        if (!empty(missedMandatoryAttributes)) {
            result = {
                success: false,
                missedMandatoryAttributes: missedMandatoryAttributes
            };
        }
    }
    return result;
}

module.exports = {
    getSchemaData: getSchemaData,
    createCustomObj: createCustomObj,
    getSavedMappingObj: getSavedMappingObj,
    getAttributeDefinitions: getAttributeDefinitions,
    addCustomAttributes: addCustomAttributes,
    executeCsvImportExportJob: executeCsvImportExportJob,
    getInventoryListId: getInventoryListId,
    getDataMapping: getDataMapping,
    addPriceAndInventoryData: addPriceAndInventoryData,
    validateMappingAttrs: validateMappingAttrs
};
