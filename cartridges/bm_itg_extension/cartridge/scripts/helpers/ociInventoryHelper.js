'use strict';

var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var oci = require('~/cartridge/scripts/util/oci');
var ociEnums = require('*/cartridge/scripts/util/ociUtils/ociEnums');
var OciRecordModel = require('*/cartridge/models/ociRecordModel');
var Site = require('dw/system/Site');

/**
 * convert from site timezone to UTC
 * @param {Date} date - date.
 * @returns {Date} date
 */
function convertToUTCtimeZone(date) {
    var timeZoneOffset = Site.getCurrent().getTimezoneOffset();
    date.setTime(date.getTime() - timeZoneOffset);
    return date;
}

/**
 * Update inventory record
 * @param {Object} params - Record data.
 * @returns {Object} ociResponse
 */
function updateOrAddInventoryRecord(params) {
    const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    var dateNow = new Calendar(new Date());
    var id = 'sfcc-ext-' + params.productId + '-' + StringUtils.formatCalendar(dateNow, 'yyyy-MM-ddHH:mmssSSS');

    var record = {
        externalRefId: id,
        location: params.location || '',
        id: id,
        sku: params.productId || ''
    };

    var futureQtys = [];
    if (params.futureQty1 && params.futureQtyDate1) {
        var futureQtyDate1 = new Calendar(convertToUTCtimeZone(new Date(params.futureQtyDate1)));
        futureQtys.push({
            quantity: parseFloat(params.futureQty1),
            expectedDate: StringUtils.formatCalendar(futureQtyDate1, DATE_FORMAT)
        });
    }

    if (params.futureQty2 && params.futureQtyDate2) {
        var futureQtyDate2 = new Calendar(convertToUTCtimeZone(new Date(params.futureQtyDate2)));
        futureQtys.push({
            quantity: parseFloat(params.futureQty2),
            expectedDate: StringUtils.formatCalendar(futureQtyDate2, DATE_FORMAT)
        });
    }

    record.futureStock = futureQtys;

    if (params.onHandQty) {
        record.onHand = parseFloat(params.onHandQty);
        record.effectiveDate = StringUtils.formatCalendar(dateNow, DATE_FORMAT);
    }

    if (params.safetyStock) {
        record.safetyStockCount = parseFloat(params.safetyStock);
    }

    var ociResponse = new oci.RequestBuilder()
        .setOciAction(ociEnums.ENDPOINTS.UPDATE_INVENTORY_RECORD)
        .setBody({ records: [record] })
        .execute();

    return ociResponse;
}

/**
 * Get groups and locations
 * @returns {Object} groupsAndLocations
 */
function getGroupsAndLocations() {
    var constants = require('~/cartridge/scripts/helpers/constants');

    var groupsAndLocationsPath = constants.OMNI_CHANNEL_INVENTORY.IMPEX_PATH + constants.OMNI_CHANNEL_INVENTORY.GROUPS_AND_LOCATIONS_FOLDER;
    var impexPath = File.IMPEX + '/src' + groupsAndLocationsPath;
    var fileName = constants.OMNI_CHANNEL_INVENTORY.GROUPS_AND_LOCATIONS_FILE;
    var directory = new File(impexPath);
    var groupsAndLocations = [];
    var downloadTime = '-';
    var fileList = directory.list();
    var groupsAndLocationsFileName;

    if (!empty(fileList) && !empty(fileName)) {
        for (var i = 0; i < fileList.length; i++) {
            var file = fileList[i];
            if (file === fileName) {
                groupsAndLocationsFileName = file;
                break;
            }
        }
    }
    if (groupsAndLocationsFileName) {
        var groupsAndLocationsFile = new File(impexPath + groupsAndLocationsFileName);
        if (groupsAndLocationsFile.exists()) {
            var fileReader = new FileReader(groupsAndLocationsFile, 'UTF-8');
            try {
                var fileContent = fileReader.readLine();
                if (!empty(fileContent)) {
                    var fileContentObject = JSON.parse(fileContent);
                    groupsAndLocations = fileContentObject.groups || [];
                    downloadTime = fileContentObject.downloadTime || '-';
                }
            } finally {
                fileReader.close();
            }
        }
    }

    return {
        groupsAndLocations: groupsAndLocations,
        downloadTime: downloadTime
    };
}

/**
 * Search inventory
 * @param {string} productIds - Product IDs.
 * @param {string} invId - Inventory ID.
 * @returns {Object} - Results.
 */
function searchInventory(productIds, invId) {
    var bodyData = {
        skus: productIds || []
    };
    var inventoryId = !empty(invId) ? invId : ProductInventoryMgr.getInventoryList().getID();
    var groupsAndLocations = getGroupsAndLocations().groupsAndLocations;
    var isGroup = false;

    for (var i = 0; i < groupsAndLocations.length; i++) {
        if (groupsAndLocations[i].id === inventoryId) {
            isGroup = true;
            break;
        }
    }

    if (isGroup) {
        bodyData.groups = [inventoryId];
    } else {
        bodyData.locations = [inventoryId];
    }

    var ociResponse = new oci.RequestBuilder()
        .setOciAction(ociEnums.ENDPOINTS.GET_INVENTORY_RECORD)
        .setBody(bodyData)
        .execute();
    var result = ociResponse.data;
    if (ociResponse && !ociResponse.error && !ociResponse.serviceError) {
        result = isGroup ? result.groups : result.locations;
        var ociRecords = !empty(result) ? result[0].records : [];
        var records = [];
        for (var a = 0; a < ociRecords.length; a++) {
            records.push(new OciRecordModel(ociRecords[a]));
        }
        return {
            records: records,
            isGroup: isGroup,
            inventoryId: inventoryId
        };
    }

    return result;
}

module.exports = {
    updateOrAddInventoryRecord: updateOrAddInventoryRecord,
    getGroupsAndLocations: getGroupsAndLocations,
    searchInventory: searchInventory
};
