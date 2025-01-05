'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('~/cartridge/scripts/helpers/constants');
var Calendar = require('dw/util/Calendar');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var ocapi = require('~/cartridge/scripts/util/ocapi');
var preferences = require('~/cartridge/config/preferences');
var dateUtil = require('~/cartridge/scripts/util/dateUtil');
var StringUtils = require('dw/util/StringUtils');

/**
 * Builds interval message.
 * @param {Object} interval - interval
 * @returns {string} orderIntervalValue
 */
function buildTimeIntervalMsg(interval) {
    var orderIntervalValue = '';
    var lastLetter = '';
    if (!empty(interval.days) && interval.days !== '0' && interval.days !== 0) {
        lastLetter = interval.days === '1' ? '' : 's';
        orderIntervalValue += Resource.msgf('order.alert.interval.day' + lastLetter, 'automaticNotifications', null, interval.days);
    }
    if (!empty(interval.hours) && interval.hours !== '0' && interval.hours !== 0) {
        lastLetter = interval.hours === '1' ? '' : 's';
        if (orderIntervalValue) {
            orderIntervalValue += ((!empty(interval.minutes) && interval.minutes !== '0' && interval.minutes !== 0) ? ', ' : ' ' + Resource.msg('common.and', 'common', null) + ' ')
            + Resource.msgf('order.alert.interval.hour' + lastLetter, 'automaticNotifications', null, interval.hours);
        } else {
            orderIntervalValue += Resource.msgf('order.alert.interval.hour' + lastLetter, 'automaticNotifications', null, interval.hours);
        }
    }
    if (!empty(interval.minutes) && interval.minutes !== '0' && interval.minutes !== 0) {
        lastLetter = interval.minutes === '1' ? '' : 's';
        orderIntervalValue += (orderIntervalValue ? (' ' + Resource.msg('common.and', 'common', null) + ' ') : '')
        + Resource.msgf('order.alert.interval.minute' + lastLetter, 'automaticNotifications', null, interval.minutes);
    }
    return orderIntervalValue;
}

/**
 * Gets OOS notification settings from the related custom object.
 * @returns {Object} config
 */
function getOOSNotificationSettings() {
    const ANS = constants.AUTOMATED_NOTIFICATION_SYSTEM;
    var outOfStockNotifications = CustomObjectMgr.getCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.OUT_OF_STOCK_NOTIFICATION);
    if (empty(outOfStockNotifications)) {
        Transaction.wrap(function () {
            outOfStockNotifications = CustomObjectMgr.createCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.OUT_OF_STOCK_NOTIFICATION);
        });
    }
    var config = outOfStockNotifications.custom.configuration ?
            JSON.parse(outOfStockNotifications.custom.configuration) : {};
    var productArray = [];
    if (config && Object.keys(config).length) {
        Object.keys(config.products).forEach(function (productID) {
            productArray.push(productID);
        });
        config.productArray = productArray;
    } else {
        config = {
            senderEmail: '',
            recipientEmails: [],
            products: {}
        }; // initial setup
        Transaction.wrap(function () {
            outOfStockNotifications.custom.configuration = JSON.stringify(config);
        });
        config.notSetup = true;
    }
    if (empty(config.senderEmail) || empty(config.recipientEmails) || (!config.products || Object.keys(config.products) === 0)) {
        config.notSetup = true;
    }
    config.enabled = preferences.oosNotificationEnabled;
    config.saveDataUrl = URLUtils.https('AutomaticNotificationSettings-SaveOOSNotificationSettings');
    config.customObjectId = ANS.CUSTOM_OBJECTS.OUT_OF_STOCK_NOTIFICATION;
    return config;
}

/**
 * Save OOS Notification settings
 * @param {Object} data - Data
 * @returns {Object} responseObj - Result of save OOS notifications
 */
function handleSaveOOSNotificationSettings(data) {
    var storedOOSNotificationObj = getOOSNotificationSettings();
    var outOfStockNotificationsObj = {};
    outOfStockNotificationsObj.products = {};
    var productIDs = data.products ? data.products : [];
    var invalidProductIDs = [];
    var responseObj = { success: true };
    for (var i = 0; i < productIDs.length; i++) {
        var product = ProductMgr.getProduct(productIDs[i]);
        if (product) {
            if (empty(storedOOSNotificationObj.products[productIDs[i]])) {
                outOfStockNotificationsObj.products[productIDs[i]] = constants.AUTOMATED_NOTIFICATION_SYSTEM.PRODUCT_STATUS.NOT_NOTIFIED;
            } else {
                outOfStockNotificationsObj.products[productIDs[i]] = storedOOSNotificationObj.products[productIDs[i]];
            }
        } else {
            invalidProductIDs.push(productIDs[i]);
            responseObj.success = false;
            responseObj.errorMsg = Resource.msgf('field.productids.notvalid.error', 'automaticNotifications', null, invalidProductIDs.join(', '));
        }
    }
    if (responseObj.success) {
        var outOfStockNotification = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.OUT_OF_STOCK_NOTIFICATION);
        var configurationObj = JSON.parse(outOfStockNotification.custom.configuration);

        outOfStockNotificationsObj.senderEmail = configurationObj.senderEmail;
        outOfStockNotificationsObj.recipientEmails = data.recipientEmails ? data.recipientEmails : [];
        Transaction.wrap(function () {
            outOfStockNotification.custom.configuration = JSON.stringify(outOfStockNotificationsObj);
        });
    }
    return responseObj;
}

/**
 * Save order interval settings
 * @param {Object} data - Data
 * @returns {string} orderIntervalValue
 */
function handleSaveOrderIntervalSettings(data) {
    var orderIntervalAlert = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.ORDER_INTERVAL_ALERT);
    var configurationObj = JSON.parse(orderIntervalAlert.custom.configuration);

    var orderIntervalAlertObj = {};
    orderIntervalAlertObj.senderEmail = configurationObj.senderEmail;
    orderIntervalAlertObj.recipientEmails = data.recipientEmails ? data.recipientEmails : '';
    orderIntervalAlertObj.interval = data.interval;
    var orderIntervalValue = buildTimeIntervalMsg(data.interval);

    Transaction.wrap(function () {
        orderIntervalAlert.custom.configuration = JSON.stringify(orderIntervalAlertObj);
    });
    return orderIntervalValue;
}

/**
 * Save campaign settings
 * @param {Object} data - Data
 * @returns {Object} responseObj
 */
function handleSaveCampaignNotificationSettings(data) {
    var campaignNotificationObj = {};
    var responseObj = { success: true };
    var faultyCampaigns = [];
    var warningCampaigns = [];
    campaignNotificationObj.campaigns = data.campaignRecords ? data.campaignRecords : [];
    for (var i = 0; i < campaignNotificationObj.campaigns.length; i++) {
        var campaignObj = campaignNotificationObj.campaigns[i];
        var campaignId = campaignObj.campaignId;
        if (!empty(campaignId)) {
            var campaign = PromotionMgr.getCampaign(campaignId);
            if (campaign) {
                if (!campaign.enabled) {
                    responseObj.success = false;
                    faultyCampaigns.push({ campaignId: campaignId, msg: Resource.msgf('field.campaignid.notenabled.error', 'automaticNotifications', null, campaignId) });
                    responseObj.faultyCampaigns = faultyCampaigns;
                } else if (!campaign.endDate) {
                    responseObj.success = false;
                    faultyCampaigns.push({ campaignId: campaignId, msg: Resource.msg('field.campaignid.noenddate.error', 'automaticNotifications', null) });
                    responseObj.faultyCampaigns = faultyCampaigns;
                } else {
                    var dateNow = new Calendar(new Date());
                    if (campaign.endDate < dateNow.time) {
                        warningCampaigns.push({ campaignId: campaignId, msg: Resource.msg('field.campaignid.expired.error', 'automaticNotifications', null) });
                        responseObj.warningCampaigns = warningCampaigns;
                    } else {
                        var dateAfter = new Calendar(new Date());
                        dateAfter.add(Calendar.DAY_OF_MONTH, parseInt(campaignObj.days, 10));
                        dateAfter.add(Calendar.HOUR_OF_DAY, parseInt(campaignObj.hours, 10));
                        dateAfter.add(Calendar.MINUTE, parseInt(campaignObj.minutes, 10));
                        if (campaign.endDate < dateAfter.time) {
                            warningCampaigns.push({ campaignId: campaignId, msg: Resource.msg('field.campaignid.almostexpired.error', 'automaticNotifications', null) });
                            responseObj.warningCampaigns = warningCampaigns;
                        }
                    }
                }
            } else {
                responseObj.success = false;
                faultyCampaigns.push({ campaignId: campaignId, msg: Resource.msgf('field.campaignid.notexist.error', 'automaticNotifications', null, campaignId) });
                responseObj.faultyCampaigns = faultyCampaigns;
            }
        } else {
            responseObj.success = false;
            faultyCampaigns.push({ campaignId: campaignId, msg: Resource.msg('field.campaignid.missing.error', 'automaticNotifications', null) });
            responseObj.faultyCampaigns = faultyCampaigns;
        }
    }
    if (responseObj.success) {
        var campaignManagementNotification = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.CAMPAIGN_NOTIFICATION);
        var configurationObj = JSON.parse(campaignManagementNotification.custom.configuration);
        campaignNotificationObj.senderEmail = configurationObj.senderEmail;
        campaignNotificationObj.recipientEmails = data.recipientEmails ? data.recipientEmails : [];
        Transaction.wrap(function () {
            campaignManagementNotification.custom.configuration = JSON.stringify(campaignNotificationObj);
        });
    } else {
        responseObj.mainErrorMsg = Resource.msg('field.campaignid.missing.error', 'automaticNotifications', null);
    }

    return responseObj;
}

/**
 * Gets order interval alert settings from the related custom object.
 * @returns {Object} config
 */
function getOrderIntervalAlertSettings() {
    const ANS = constants.AUTOMATED_NOTIFICATION_SYSTEM;
    var orderIntervalAlert = CustomObjectMgr.getCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.ORDER_INTERVAL_ALERT);
    if (empty(orderIntervalAlert)) {
        Transaction.wrap(function () {
            orderIntervalAlert = CustomObjectMgr.createCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.ORDER_INTERVAL_ALERT);
        });
    }
    var config = orderIntervalAlert.custom.configuration ?
            JSON.parse(orderIntervalAlert.custom.configuration) : {};
    if (config && !Object.keys(config).length) {
        config = {
            senderEmail: '',
            recipientEmails: [],
            interval: {}
        }; // initial setup.
        Transaction.wrap(function () {
            orderIntervalAlert.custom.configuration = JSON.stringify(config);
        });
        config.notSetup = true;
    } else if (empty(config.senderEmail) || empty(config.recipientEmails) || (!config.interval || Object.keys(config.interval) === 0)) {
        config.notSetup = true;
    }
    config.enabled = preferences.orderIntervalAlertEnabled;
    config.saveDataUrl = URLUtils.https('AutomaticNotificationSettings-SaveOrderIntervalSettings');
    config.customObjectId = ANS.CUSTOM_OBJECTS.ORDER_INTERVAL_ALERT;
    config.orderIntervalValue = buildTimeIntervalMsg(config.interval);
    return config;
}

/**
 * Gets failed order alert settings from the related custom object.
 * @returns {Object} config
 */
function getFailedOrderAlertSettings() {
    const ANS = constants.AUTOMATED_NOTIFICATION_SYSTEM;
    var failedOrderAlert = CustomObjectMgr.getCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.FAILED_ORDER_ALERT);
    if (empty(failedOrderAlert)) {
        Transaction.wrap(function () {
            failedOrderAlert = CustomObjectMgr.createCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.FAILED_ORDER_ALERT);
        });
    }
    var config = failedOrderAlert.custom.configuration ?
            JSON.parse(failedOrderAlert.custom.configuration) : {};
    if (config && !Object.keys(config).length) {
        config = {
            senderEmail: '',
            recipientEmails: [],
            interval: {},
            countThreshold: 0
        }; // initial setup.
        Transaction.wrap(function () {
            failedOrderAlert.custom.configuration = JSON.stringify(config);
        });
        config.notSetup = true;
    } else if (empty(config.senderEmail) || empty(config.recipientEmails) || (!config.interval || Object.keys(config.interval) === 0)) {
        config.notSetup = true;
    }
    config.enabled = preferences.failedOrderAlertEnabled;
    config.saveDataUrl = URLUtils.https('AutomaticNotificationSettings-SaveFailedOrderAlertSettings');
    config.customObjectId = ANS.CUSTOM_OBJECTS.FAILED_ORDER_ALERT;
    config.orderIntervalValue = buildTimeIntervalMsg(config.interval);

    return config;
}

/**
 * Save failed orders allert settings
 * @param {Object} data - Data
 * @returns {string} orderIntervalValue
 */
function handleSaveFailedOrderAlertSettings(data) {
    var failedOrderAlert = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.FAILED_ORDER_ALERT);
    var configurationObj = JSON.parse(failedOrderAlert.custom.configuration);

    var failedOrderAlertObj = {};
    failedOrderAlertObj.senderEmail = configurationObj.senderEmail;
    failedOrderAlertObj.recipientEmails = data.recipientEmails ? data.recipientEmails : '';
    failedOrderAlertObj.interval = data.interval;
    failedOrderAlertObj.countThreshold = data.countThreshold;
    var orderIntervalValue = buildTimeIntervalMsg(data.interval);

    Transaction.wrap(function () {
        failedOrderAlert.custom.configuration = JSON.stringify(failedOrderAlertObj);
    });
    return orderIntervalValue;
}

/**
 * Gets content notification settings from the related custom object.
 * @returns {Object} config
 */
function getCampaignNotificationSettings() {
    const ANS = constants.AUTOMATED_NOTIFICATION_SYSTEM;
    var campaignMgmtNotifications = CustomObjectMgr.getCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.CAMPAIGN_NOTIFICATION);
    if (empty(campaignMgmtNotifications)) {
        Transaction.wrap(function () {
            campaignMgmtNotifications = CustomObjectMgr.createCustomObject(ANS.CUSTOM_OBJECT_TYPE, ANS.CUSTOM_OBJECTS.CAMPAIGN_NOTIFICATION);
        });
    }
    var config = campaignMgmtNotifications.custom.configuration ?
            JSON.parse(campaignMgmtNotifications.custom.configuration) : {};
    var campaignNotificationObj;
    if (!Object.keys(config).length) {
        campaignNotificationObj = {
            senderEmail: '',
            recipientEmails: [],
            campaigns: []
        }; // initial setup.
        Transaction.wrap(function () {
            campaignMgmtNotifications.custom.configuration = JSON.stringify(campaignNotificationObj);
        });
        config.notSetup = true;
    } else if (empty(config.senderEmail) || empty(config.recipientEmails) || empty(config.campaigns)) {
        config.notSetup = true;
    }
    config.enabled = preferences.campaignNotificationEnabled;
    config.saveDataUrl = URLUtils.https('AutomaticNotificationSettings-SaveCampaignNotificationSettings');
    config.customObjectId = ANS.CUSTOM_OBJECTS.CAMPAIGN_NOTIFICATION;
    return config;
}

/**
 * Gets campaign suggestions.
 * @param {string} searchPhrase - Search phrase.
 * @returns {Object} suggestions
 */
function getCampaignSuggestions(searchPhrase) {
    var campaignDetails = [];
    var errorMessage;
    if (!empty(searchPhrase)) {
        var ocapiResponse = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.CAMPAIGN_NOTIFICATION)
        .setQuery({
            text_query: {
                fields: ['campaign_id'],
                search_phrase: searchPhrase
            }
        })
        .setPageSize(100)
        .execute();
        var responseObj = ocapiResponse.data;
        if (empty(responseObj.errorMessage)) {
            var hits = responseObj ? responseObj.hits : '';
            var now = new Calendar(new Date());
            if (!empty(hits)) {
                for (var i = 0; i < hits.length; i++) {
                    var hit = hits[i];
                    if (hit.enabled && hit.end_date) {
                        var campaignEndDate = new Date(hit.end_date);
                        if (campaignEndDate > now.time) {
                            var campaignEndCalendar = new Calendar(dateUtil.convertUTCToSiteTimezone(campaignEndDate));
                            var campaignFormattedEndDate = StringUtils.formatCalendar(campaignEndCalendar, request.locale, Calendar.INPUT_DATE_PATTERN);
                            var campaignFormattedEndTime = StringUtils.formatCalendar(campaignEndCalendar, request.locale, Calendar.INPUT_TIME_PATTERN).toUpperCase();
                            campaignDetails.push({
                                campaignId: hit.campaign_id,
                                campaignEndDate: campaignFormattedEndDate + ' ' + campaignFormattedEndTime
                            });
                        }
                    }
                }
            }
        } else {
            errorMessage = responseObj.errorMessage;
        }
    }
    return {
        campaignDetails: campaignDetails,
        errorMessage: errorMessage
    };
}

/**
 * Save sender email of a specific customObject
 * @param {string} senderEmail - Sender email
 * @param {Array} customObjectIds - Custom object IDs
 */
function saveSenderEmail(senderEmail, customObjectIds) {
    for (var i = 0; i < customObjectIds.length; i++) {
        var customObjectId = customObjectIds[i];
        var customObject = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, customObjectId);
        var customObjectConfiguration = JSON.parse(customObject.custom.configuration);
        customObjectConfiguration.senderEmail = senderEmail;
        // eslint-disable-next-line no-loop-func
        Transaction.wrap(function () {
            customObject.custom.configuration = JSON.stringify(customObjectConfiguration);
        });
    }
}

/**
 * Validate products.
 * @param {Array} productIDs - ProductIDs
 * @returns {Object} result
 */
function validateProducts(productIDs) {
    var invalidProductIDs = [];
    var result = { valid: true };
    for (var i = 0; i < productIDs.length; i++) {
        var product = ProductMgr.getProduct(productIDs[i]);
        if (!product) {
            invalidProductIDs.push(productIDs[i]);
        }
    }
    if (!empty(invalidProductIDs)) {
        result.valid = false;
        result.errorMsg = Resource.msgf('field.productids.notvalid.error', 'automaticNotifications', null, invalidProductIDs.join(', '));
    }
    return result;
}

/**
* Validate campaigns.
* @param {Array} campaigns - Campaigns
* @returns {Object} result
*/
function validateCampaigns(campaigns) {
    var result = { valid: true };
    var faultyCampaigns = {};
    var warningCampaigns = {};
    for (var i = 0; i < campaigns.length; i++) {
        var campaignObj = campaigns[i];
        var campaignId = campaignObj.campaignId;
        var campaign = PromotionMgr.getCampaign(campaignId);
        if (campaign) {
            if (!campaign.enabled) {
                faultyCampaigns[campaignId] = Resource.msgf('field.campaignid.notenabled.error', 'automaticNotifications', null, campaignId);
            } else if (!campaign.endDate) {
                faultyCampaigns[campaignId] = Resource.msg('field.campaignid.noenddate.error', 'automaticNotifications', null);
            } else {
                var dateNow = new Calendar(new Date());
                if (campaign.endDate < dateNow.time) {
                    warningCampaigns[campaignId] = Resource.msg('field.campaignid.expired.error', 'automaticNotifications', null);
                } else {
                    var dateAfter = new Calendar(new Date());
                    dateAfter.add(Calendar.DAY_OF_MONTH, parseInt(campaignObj.days, 10));
                    dateAfter.add(Calendar.HOUR_OF_DAY, parseInt(campaignObj.hours, 10));
                    dateAfter.add(Calendar.MINUTE, parseInt(campaignObj.minutes, 10));
                    if (campaign.endDate < dateAfter.time) {
                        warningCampaigns[campaignId] = Resource.msg('field.campaignid.almostexpired.error', 'automaticNotifications', null);
                    }
                }
            }
        } else {
            faultyCampaigns[campaignId] = Resource.msgf('field.campaignid.notexist.error', 'automaticNotifications', null, campaignId);
        }
    }
    if (!empty(faultyCampaigns)) {
        result.valid = false;
        result.faultyCampaigns = faultyCampaigns;
    }
    result.warningCampaigns = warningCampaigns;

    return result;
}

/**
 * Formats text to the correct singular or plural terms
 * @param {string} text - text to format
 * @param {number} count - number of items
 * @returns {string} formatted text
 */
function setPlurality(text, count) {
    var resultText = text;
    if (count > 1) {
        resultText = resultText.replace('(s)', 's');
        resultText = resultText.replace('(be)', 'are');
        resultText = resultText.replace('(this/these)', 'these');
    } else {
        resultText = resultText.replace('(s)', '');
        resultText = resultText.replace('(be)', 'is');
        resultText = resultText.replace('(this/these)', 'this');
    }
    return resultText;
}

module.exports = {
    getOOSNotificationSettings: getOOSNotificationSettings,
    getOrderIntervalAlertSettings: getOrderIntervalAlertSettings,
    getFailedOrderAlertSettings: getFailedOrderAlertSettings,
    getCampaignNotificationSettings: getCampaignNotificationSettings,
    getCampaignSuggestions: getCampaignSuggestions,
    handleSaveOrderIntervalSettings: handleSaveOrderIntervalSettings,
    handleSaveOOSNotificationSettings: handleSaveOOSNotificationSettings,
    handleSaveCampaignNotificationSettings: handleSaveCampaignNotificationSettings,
    handleSaveFailedOrderAlertSettings: handleSaveFailedOrderAlertSettings,
    saveSenderEmail: saveSenderEmail,
    validateProducts: validateProducts,
    validateCampaigns: validateCampaigns,
    setPlurality: setPlurality
};
