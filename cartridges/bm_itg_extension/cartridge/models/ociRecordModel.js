'use strict';

var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');

/**
 * update date format
 * @param {string} date - date.
 * @returns {string} updatedDate
 */
function updateFormat(date) {
    var updatedDate = date.replace(':00Z', ':00.000Z');
    return updatedDate;
}

/**
 * convert from UTC timezone to site timezone
 * @param {Date} date - date.
 * @returns {Date} date
 */
function convertToSiteTimeZone(date) {
    var timeZoneOffset = Site.getCurrent().getTimezoneOffset();
    date.setTime(date.getTime() + timeZoneOffset);
    return date;
}

/**
 * @param {Object} ociRecord - Product OCI Record
 * @constructor
 */
function OciRecordModel(ociRecord) {
    var dateFormat = 'MM/dd/yyyy hh:mm:ss a';
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
    var effectiveDate = new Date(updateFormat(ociRecord.effectiveDate || ''));
    effectiveDate = new Calendar(convertToSiteTimeZone(effectiveDate));
    effectiveDate = StringUtils.formatCalendar(effectiveDate, dateFormat);
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
            var futureExpectedDate = new Calendar(convertToSiteTimeZone(expectedDate));

            futures[j].expectedDate = StringUtils.formatCalendar(futureExpectedDate, dateFormat);
        }
    }

    this.futures = futures;
    this.futureExpectations = futureExpectations;
    this.future = '';
    if (nearestFutureDate && nearestFutureQty) {
        nearestFutureDate = StringUtils.formatCalendar(new Calendar(nearestFutureDate), dateFormat);
        this.future = StringUtils.format('{0} ({1})', Number(nearestFutureQty).toFixed(2), nearestFutureDate);
    }
}

module.exports = OciRecordModel;
