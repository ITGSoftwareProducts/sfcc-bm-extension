'use strict';

/**
 * Checks for campaigns endDate and sends an email accordingly.
 * @returns {dw.system.Status} status
 */
function execute() {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var Calendar = require('dw/util/Calendar');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Site = require('dw/system/Site');
    var StringUtils = require('dw/util/StringUtils');
    var emailHelper = require('~/cartridge/scripts/helpers/emailHelper');
    var automaticNotificationHelper = require('~/cartridge/scripts/helpers/automaticNotificationHelper');
    var constants = require('~/cartridge/scripts/helpers/constants');
    var jobResources = require('~/cartridge/scripts/util/jobResources');
    var renderTemplateHelper = require('~/cartridge/scripts/renderTemplateHelper');

    var campaignNotificationObj = automaticNotificationHelper.getCampaignNotificationSettings();

    if (campaignNotificationObj.enabled && !campaignNotificationObj.notSetup && !empty(campaignNotificationObj.campaigns)) {
        var campaignList = [];
        var campaignObjs = [];
        var notNotifiedCampaigns = [];
        Logger.info('Start checking the expiration status for list of campaigns');
        for (var i = 0; i < campaignNotificationObj.campaigns.length; i++) {
            var campaignObj = campaignNotificationObj.campaigns[i];
            try {
                var dateAfter = new Calendar(new Date());
                dateAfter.add(Calendar.DAY_OF_MONTH, parseInt(campaignObj.days, 10));
                dateAfter.add(Calendar.HOUR_OF_DAY, parseInt(campaignObj.hours, 10));
                dateAfter.add(Calendar.MINUTE, parseInt(campaignObj.minutes, 10));
                var campaign = PromotionMgr.getCampaign(campaignObj.campaignId);
                if (campaign && campaign.endDate < dateAfter.time) {
                    Logger.info('Campaign ({0}) is about to expire', campaignObj.campaignId);
                    var calendar = new Calendar(new Date(campaign.getEndDate()));
                    calendar.setTimeZone(Site.current.getTimezone());
                    var campaignEndDate = StringUtils.formatCalendar(calendar, 'EEE, dd MMM yyyy HH:mm:ss z');
                    campaignList.push([campaign.getID(), campaignEndDate]);
                    campaignObjs.push(campaign);
                } else {
                    notNotifiedCampaigns.push(campaignObj);
                }
            } catch (e) {
                Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
            }
        }

        if (!empty(campaignList)) {
            var dataColumns = [
                jobResources['campaign.email.column1'],
                jobResources['campaign.email.column2']
            ];
            var renderedTemplate = renderTemplateHelper.buildHtmlEmailTemplate({
                messageHeader: jobResources['campaign.email.message.header'],
                messageFooter: jobResources['campaign.email.message.footer'],
                columns: dataColumns,
                list: campaignList
            });
            var senderEmail = campaignNotificationObj.senderEmail;
            emailHelper.sendMail({
                from: senderEmail,
                recipient: campaignNotificationObj.recipientEmails,
                subject: jobResources['campaign.email.subject'],
                content: renderedTemplate
            });
            var campaignManagementNotification = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.CAMPAIGN_NOTIFICATION);
            Transaction.wrap(function () {
                campaignNotificationObj.campaigns = notNotifiedCampaigns;
                campaignManagementNotification.custom.configuration = JSON.stringify(campaignNotificationObj);
            });
            Logger.info('Notification Email has been sent for the following campaigns: {0}', campaignObjs.join(','));
        }
    } else if (!campaignNotificationObj.enabled) {
        Logger.info('The (Campaign Notification) service is not enabled for the current site');
    } else if (campaignNotificationObj.notSetup || empty(campaignNotificationObj.campaigns)) {
        Logger.info('The (Campaign Notification) settings are not set up yet in the current site');
    }
    return new Status(Status.OK);
}

exports.execute = execute;
