'use strict';

var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var ProductMgr = require('dw/catalog/ProductMgr');
var dateUtil = require('~/cartridge/scripts/util/dateUtil');

/**
 * update date format
 * @param {string} date - date.
 * @returns {string} updatedDate
 */
function updateFormat(date) {
    var updatedDate = date.replace('Z', '.000Z');
    return updatedDate;
}

/**
 * convert the date from UTC timezone to site timezone, and sets the locale format
 * @param {Date} datetime - date to localize.
 * @param {boolean} isGroupInventory - true if this record is fetched from a location group
 * @param {boolean} isFutureDate - true if the passed datetime is an inventory record's future quantity date
 * @returns {string} localized as a string date
 */
function localizeDateTime(datetime, isGroupInventory, isFutureDate) {
    var calendar = new Calendar(dateUtil.convertUTCToSiteTimezone(datetime));
    var formattedDate = StringUtils.formatCalendar(calendar, request.locale, Calendar.INPUT_DATE_PATTERN);
    if (isGroupInventory && isFutureDate) {
        return formattedDate;
    }
    var formattedTime = StringUtils.formatCalendar(calendar, request.locale, Calendar.TIME_PATTERN);
    return formattedDate + ' ' + formattedTime;
}

/**
 * @param {Object} ociRecord - Product OCI Record
 * @constructor
 */
function OciRecordModel(ociRecord) {
    this.sku = ociRecord.sku;
    this.productName = '';
    if (ociRecord.sku) {
        var apiProduct = ProductMgr.getProduct(ociRecord.sku);
        this.productName = apiProduct ? apiProduct.getName() : '';
    }

    this.onHand = Number(ociRecord.onHand || 0).toFixed(2);
    this.safetyStockCount = Number(ociRecord.safetyStockCount || 0).toFixed(2);
    this.reserved = Number(ociRecord.reserved || 0).toFixed(2);
    this.ato = Number(ociRecord.ato || 0).toFixed(2);
    this.atf = Number(ociRecord.atf || 0).toFixed(2);
    var effectiveDate = '';
    if (ociRecord.effectiveDate) {
        effectiveDate = new Date(updateFormat(ociRecord.effectiveDate));
        effectiveDate = localizeDateTime(effectiveDate, ociRecord.isGroupInventory, false);
    }
    this.effectiveDate = effectiveDate;

    var futureExpectations = 0;
    var nearestFutureDate;
    var nearestFutureQty;
    var futures = ociRecord.futures;
    if (ociRecord.futures) {
        for (var j = 0; j < ociRecord.futures.length; j++) {
            futureExpectations += parseInt(ociRecord.futures[j].quantity, 10);
            var expectedDate = new Date(updateFormat(ociRecord.futures[j].expectedDate));
            if (nearestFutureDate) {
                if (nearestFutureDate > expectedDate) {
                    nearestFutureDate = expectedDate;
                    nearestFutureQty = ociRecord.futures[j].quantity;
                }
            } else {
                nearestFutureDate = expectedDate;
                nearestFutureQty = ociRecord.futures[j].quantity;
            }

            futures[j].expectedDate = localizeDateTime(expectedDate, ociRecord.isGroupInventory, true);
        }
    }

    this.futures = futures;
    this.futureExpectations = futureExpectations;
    this.future = '';
    if (nearestFutureDate && nearestFutureQty) {
        nearestFutureDate = localizeDateTime(nearestFutureDate, ociRecord.isGroupInventory, true);
        this.future = StringUtils.format('{0} ({1})', Number(nearestFutureQty).toFixed(2), nearestFutureDate);
    }
}

module.exports = OciRecordModel;
