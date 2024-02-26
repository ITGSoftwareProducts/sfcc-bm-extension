'use strict';
var preferencesHelper = require('~/cartridge/scripts/helpers/preferencesHelper');
var preferenceAttributes = preferencesHelper.getPreferenceAttributes();

module.exports = {
    ocapiVersion: '23_2',
    orderIntervalAlertEnabled: preferencesHelper.getPreferenceValue('bmExtOrderIntervalAlertEnabled', preferenceAttributes),
    oosNotificationEnabled: preferencesHelper.getPreferenceValue('bmExtOOSNotificationEnabled', preferenceAttributes),
    campaignNotificationEnabled: preferencesHelper.getPreferenceValue('bmExtCampaignNotificationEnabled', preferenceAttributes),
    failedOrderAlertEnabled: preferencesHelper.getPreferenceValue('bmExtFailedOrderAlertEnabled', preferenceAttributes),
    realmId: preferencesHelper.getPreferenceValue('bmExtRealmId', preferenceAttributes),
    instanceId: preferencesHelper.getPreferenceValue('bmExtInstanceId', preferenceAttributes),
    organizationId: preferencesHelper.getPreferenceValue('bmExtOrganizationId', preferenceAttributes),
    ociVersion: '1',
    shortCode: preferencesHelper.getPreferenceValue('bmExtShortCode', preferenceAttributes),
    noAvailablePreferences: empty(preferenceAttributes)
};
