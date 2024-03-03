'use strict';

var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var currentSite = require('dw/system/Site').getCurrent();
var responseUtil = require('~/cartridge/scripts/util/responseUtil');
var guard = require('~/cartridge/scripts/util/guard');
var app = require('*/cartridge/scripts/util/app');
var automaticNotificationHelper = require('*/cartridge/scripts/helpers/automaticNotificationHelper');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');

/**
 * Shows OOS notifications page.
 */
function showOOSNotificationSettings() {
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowSiteOverview')
        },
        {
            htmlValue: Resource.msg('breadcrumb.products.catalogs.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'prod-cat')
        },
        {
            htmlValue: Resource.msg('feature.oos.title', 'automaticNotifications', null)
        }
    ];
    try {
        var outOfStockNotification = automaticNotificationHelper.getOOSNotificationSettings();
        var validationResult = {};
        if (outOfStockNotification.productArray && outOfStockNotification.productArray.length) {
            validationResult = automaticNotificationHelper.validateProducts(outOfStockNotification.productArray);
        }
        var EnablementURL = URLUtils.https('AutomaticNotificationSettings-UpdateEnablementPreference');
        var saveSenderEmailUrl = URLUtils.https('AutomaticNotificationSettings-SaveSenderEmail');
        ISML.renderTemplate('automaticNotificationSettings/notificationMainPage', {
            outOfStockNotification: outOfStockNotification,
            EnablementURL: EnablementURL,
            breadcrumbs: breadcrumbs,
            saveSenderEmailUrl: saveSenderEmailUrl,
            validationResult: validationResult,
            template: 'automaticNotificationSettings/outOfStockNotification'
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('AutomaticNotificationSettings-ShowOOSNotificationSettings').toString(), request.httpQueryString)
        });
    }
}

/**
 * Shows order alerts page.
 */
function showOrderAlertSettings() {
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowSiteOverview')
        },
        {
            htmlValue: Resource.msg('breadcrumb.ordering.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'orders')
        },
        {
            htmlValue: Resource.msg('feature.ordering.title', 'automaticNotifications', null)
        }
    ];
    try {
        var orderIntervalAlert = automaticNotificationHelper.getOrderIntervalAlertSettings();
        var failedOrderAlert = automaticNotificationHelper.getFailedOrderAlertSettings();
        var EnablementURL = URLUtils.https('AutomaticNotificationSettings-UpdateEnablementPreference');
        var saveSenderEmailUrl = URLUtils.https('AutomaticNotificationSettings-SaveSenderEmail');

        ISML.renderTemplate('automaticNotificationSettings/notificationMainPage', {
            orderIntervalAlert: orderIntervalAlert,
            failedOrderAlert: failedOrderAlert,
            EnablementURL: EnablementURL,
            saveSenderEmailUrl: saveSenderEmailUrl,
            breadcrumbs: breadcrumbs,
            template: 'automaticNotificationSettings/orderAlerts'
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('AutomaticNotificationSettings-ShowOrderAlertSettings').toString(), request.httpQueryString)
        });
    }
}

/**
 * Shows campaign notifications page.
 */
function showCampaignNotificationSetting() {
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('breadcrumb.merchant.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowSiteOverview')
        },
        {
            htmlValue: Resource.msg('breadcrumb.online.marketing.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'marketing')
        },
        {
            htmlValue: Resource.msg('feature.campaign.title', 'automaticNotifications', null)
        }
    ];
    try {
        var campaignManagementNotification = automaticNotificationHelper.getCampaignNotificationSettings();
        var validationResult = {};
        if (campaignManagementNotification.campaigns && campaignManagementNotification.campaigns.length) {
            validationResult = automaticNotificationHelper.validateCampaigns(campaignManagementNotification.campaigns);
        }
        var campaignSuggestionsURL = URLUtils.https('AutomaticNotificationSettings-GetCampaignSuggestions');
        var EnablementURL = URLUtils.https('AutomaticNotificationSettings-UpdateEnablementPreference');
        var saveSenderEmailUrl = URLUtils.https('AutomaticNotificationSettings-SaveSenderEmail');

        ISML.renderTemplate('automaticNotificationSettings/notificationMainPage', {
            campaignManagementNotification: campaignManagementNotification,
            campaignSuggestionsURL: campaignSuggestionsURL,
            EnablementURL: EnablementURL,
            saveSenderEmailUrl: saveSenderEmailUrl,
            breadcrumbs: breadcrumbs,
            validationResult: validationResult,
            template: 'automaticNotificationSettings/campaignNotification'
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('AutomaticNotificationSettings-ShowCampaignNotificationSetting').toString(), request.httpQueryString)
        });
    }
}

/**
 * Saves OOS notification settings.
 */
function saveOOSNotificationSettings() {
    var params = request.httpParameterMap;
    var responseObj = { success: true };
    var data = JSON.parse(params.data);
    try {
        responseObj = automaticNotificationHelper.handleSaveOOSNotificationSettings(data);
    } catch (e) {
        responseObj.success = false;
        responseObj.errorMsg = e.message;
    }
    responseUtil.renderJSON(responseObj);
}

/**
 * Saves order interval alert settings.
 */
function saveOrderIntervalSettings() {
    var params = request.httpParameterMap;
    var responseObj = { success: true };
    var data = JSON.parse(params.data);
    try {
        var orderIntervalValue = automaticNotificationHelper.handleSaveOrderIntervalSettings(data);
        responseObj.orderIntervalValue = orderIntervalValue;
    } catch (e) {
        responseObj.success = false;
        responseObj.errorMsg = e.message;
    }
    responseUtil.renderJSON(responseObj);
}

/**
 * Saves content management notification Settings.
 */
function saveCampaignNotificationSettings() {
    var params = request.httpParameterMap;
    var responseObj = { success: true };
    var data = JSON.parse(params.data);
    try {
        responseObj = automaticNotificationHelper.handleSaveCampaignNotificationSettings(data);
    } catch (e) {
        responseObj.success = false;
        responseObj.errorMsg = e.message;
    }
    responseUtil.renderJSON(responseObj);
}


/**
 * Saves failed order alert settings.
 */
function saveFailedOrderAlertSettings() {
    var params = request.httpParameterMap;
    var responseObj = { success: true };
    var data = JSON.parse(params.data);
    try {
        var orderIntervalValue = automaticNotificationHelper.handleSaveFailedOrderAlertSettings(data);
        responseObj.orderIntervalValue = orderIntervalValue;
    } catch (e) {
        responseObj.success = false;
        responseObj.errorMsg = e.message;
    }
    responseUtil.renderJSON(responseObj);
}

/**
 * Gets Campaign Suggestions.
 */
function getCampaignSuggestions() {
    var params = request.httpParameterMap;
    var searchPhrase = params.searchPhrase && params.searchPhrase.value ? params.searchPhrase.value : '';
    var responseObj = {
        success: true
    };
    try {
        var suggestionsResult = automaticNotificationHelper.getCampaignSuggestions(searchPhrase);
        if (empty(suggestionsResult.errorMessage)) {
            responseObj.campaignDetails = suggestionsResult.campaignDetails;
        } else {
            responseObj.success = false;
            responseObj.serverErrors = [suggestionsResult.errorMessage];
        }
    } catch (e) {
        responseObj.success = false;
        responseObj.errorMessage = e.message;
    }
    responseUtil.renderJSON(responseObj);
}

/**
 * Update Enablement preference.
 */
function updateEnablementPreference() {
    var params = request.httpParameterMap;
    var data = JSON.parse(params.data);
    var prefId = data.prefId ? data.prefId : '';
    var enabled = data.enabled ? data.enabled : false;
    Transaction.wrap(function () {
        currentSite.setCustomPreferenceValue(prefId, enabled);
    });
}

/**
 * Save sender email value.
 */
function saveSenderEmail() {
    var params = app.getRequestFormOrParams();
    var senderEmail = params.senderEmail;
    var customObjectIds = JSON.parse(params.customObjectIds);
    automaticNotificationHelper.saveSenderEmail(senderEmail, customObjectIds);
    return;
}


/** Renders the landing page of "Automatic Notification Settings" module in "Products and Catalogs" menu.
 * @see module:controllers/AutomaticNotificationSettings~Start */
exports.ShowOOSNotificationSettings = guard.ensure(['https', 'get', 'csrf'], showOOSNotificationSettings);
/** Renders the landing page of "Automatic Notification Settings" module on "Ordering" menu.
 * @see module:controllers/AutomaticNotificationSettings~ShowOrderAlertSettings */
exports.ShowOrderAlertSettings = guard.ensure(['https', 'get', 'csrf'], showOrderAlertSettings);
/** Renders the landing page of "Automatic Notification Settings" module in "Online Marketing" menu.
 * @see module:controllers/AutomaticNotificationSettings~ShowCampaignNotificationSetting */
exports.ShowCampaignNotificationSetting = guard.ensure(['https', 'get', 'csrf'], showCampaignNotificationSetting);
/** Saves the out od stock product notification settings.
 * @see module:controllers/AutomaticNotificationSettings~SaveOOSNotificationSettings */
exports.SaveOOSNotificationSettings = guard.ensure(['https', 'post', 'csrf'], saveOOSNotificationSettings);
/** Saves the order interval notification settings.
 * @see module:controllers/AutomaticNotificationSettings~SaveOrderIntervalSettings */
exports.SaveOrderIntervalSettings = guard.ensure(['https', 'post', 'csrf'], saveOrderIntervalSettings);
/** Saves the campaign notification settings.
 * @see module:controllers/AutomaticNotificationSettings~SaveCampaignNotificationSettings */
exports.SaveCampaignNotificationSettings = guard.ensure(['https', 'post', 'csrf'], saveCampaignNotificationSettings);
/** Saves the failed orders notification settings.
 * @see module:controllers/AutomaticNotificationSettings~SaveFailedOrderAlertSettings */
exports.SaveFailedOrderAlertSettings = guard.ensure(['https', 'post', 'csrf'], saveFailedOrderAlertSettings);
/** Gets list of campaign suggestions.
 * @see module:controllers/AutomaticNotificationSettings~GetCampaignSuggestions */
exports.GetCampaignSuggestions = guard.ensure(['https', 'get', 'csrf'], getCampaignSuggestions);
/** Updates an enablement preference value.
 * @see module:controllers/AutomaticNotificationSettings~UpdateEnablementPreference */
exports.UpdateEnablementPreference = guard.ensure(['https', 'post', 'csrf'], updateEnablementPreference);
/** Saves sender email value.
 * @see module:controllers/AutomaticNotificationSettings~SaveSenderEmail */
exports.SaveSenderEmail = guard.ensure(['https', 'post', 'csrf'], saveSenderEmail);
