'use strict';

var Site = require('dw/system/Site');
var System = require('dw/system/System');
var StringUtils = require('dw/util/StringUtils');

/**
 * Returns the instance timezone offset
 * @returns {number} instance timezone offset value
 */
function getInstanceOffset() {
    var instDate = new Date(StringUtils.formatCalendar(System.getCalendar()));
    var curDate = new Date();
    curDate.setSeconds(0, 0);
    instDate.setSeconds(0, 0);
    return instDate.getTime() - curDate.getTime();
}

/**
 * Converts the value of the passed UTC datetime to match the Site timezone
 * @param {Date|string} datetime Date object to be converted
 * @returns {Date} Datetime in site's timezone
 */
function convertUTCToSiteTimezone(datetime) {
    const offset = Site.getCurrent().getTimezoneOffset();
    var localeDateTimestamp = new Date(datetime).getTime();
    return new Date(localeDateTimestamp + offset);
}

/**
 * Converts the value of the Site timezone datetime to UTC
 * @param {Date|string} datetime Date object to be converted
 * @returns {Date} Datetime in instance's timezone
 */
function convertSiteTimezoneToUTC(datetime) {
    const offset = Site.getCurrent().getTimezoneOffset();
    var localeDateTimestamp = new Date(datetime).getTime();
    return new Date(localeDateTimestamp - offset);
}

/**
 * Converts the value of the Instance timezone datetime to UTC
 * @param {Date|string} datetime Date object to be converted
 * @returns {Date} Datetime in instance's timezone
 */
function convertInstanceTimezoneToUTC(datetime) {
    const offset = getInstanceOffset();
    var localeDateTimestamp = new Date(datetime).getTime();
    return new Date(localeDateTimestamp - offset);
}

module.exports = {
    convertUTCToSiteTimezone: convertUTCToSiteTimezone,
    convertSiteTimezoneToUTC: convertSiteTimezoneToUTC,
    convertInstanceTimezoneToUTC: convertInstanceTimezoneToUTC
};
