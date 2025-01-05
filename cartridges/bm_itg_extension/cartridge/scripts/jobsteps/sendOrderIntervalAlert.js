'use strict';

var ordersCount = 0;

/**
 * Process order.
*/
function processOrder() {
    ordersCount++;
}

/**
 * Checks for orders placement in specific interval and sends an email accordingly.
 * @returns {dw.system.Status} status
 */
function execute() {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var Calendar = require('dw/util/Calendar');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var StringUtils = require('dw/util/StringUtils');
    var emailHelper = require('~/cartridge/scripts/helpers/emailHelper');
    var renderTemplateHelper = require('~/cartridge/scripts/renderTemplateHelper');
    var automaticNotificationHelper = require('~/cartridge/scripts/helpers/automaticNotificationHelper');
    var constants = require('~/cartridge/scripts/helpers/constants');
    var jobResources = require('~/cartridge/scripts/util/jobResources');
    var currentSite = require('dw/system/Site').getCurrent();

    var orderIntervalAlertObj = automaticNotificationHelper.getOrderIntervalAlertSettings();

    if (orderIntervalAlertObj.enabled && !orderIntervalAlertObj.notSetup) {
        var isAlertSent = false;
        if (orderIntervalAlertObj.lastNotification) {
            var lastNotification = new Calendar(new Date(orderIntervalAlertObj.lastNotification));
            lastNotification.add(Calendar.DAY_OF_MONTH, parseInt(orderIntervalAlertObj.interval.days, 10));
            lastNotification.add(Calendar.HOUR_OF_DAY, parseInt(orderIntervalAlertObj.interval.hours, 10));
            lastNotification.add(Calendar.MINUTE, parseInt(orderIntervalAlertObj.interval.minutes, 10));
            var currentTime = new Calendar(new Date());
            if (currentTime.time < lastNotification.time) {
                Logger.info('The (Order Interval Alert) were already sent at {0}', orderIntervalAlertObj.lastNotification);
                isAlertSent = true;
            }
        }
        if (!isAlertSent) {
            try {
                Logger.info('Start checking the orders placement status in latest specific interval');
                var dateAfter = new Calendar(new Date());
                dateAfter.add(Calendar.DAY_OF_MONTH, -parseInt(orderIntervalAlertObj.interval.days, 10));
                dateAfter.add(Calendar.HOUR_OF_DAY, -parseInt(orderIntervalAlertObj.interval.hours, 10));
                dateAfter.add(Calendar.MINUTE, -parseInt(orderIntervalAlertObj.interval.minutes, 10));
                var queryString = 'creationDate >= {0} AND status != {1} AND status != {2}';
                OrderMgr.processOrders(processOrder, queryString, dateAfter.getTime(), Order.ORDER_STATUS_CREATED, Order.ORDER_STATUS_FAILED);
            } catch (e) {
                Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
            }
            if (ordersCount === 0) {
                var interval = '';
                if (orderIntervalAlertObj.interval.days.length > 0 && orderIntervalAlertObj.interval.days !== '0') {
                    var formattedDays = StringUtils.format(jobResources['order.alert.interval.days'], orderIntervalAlertObj.interval.days);
                    interval += automaticNotificationHelper.setPlurality(formattedDays, parseInt(orderIntervalAlertObj.interval.days, 10));
                }
                if (orderIntervalAlertObj.interval.hours.length > 0 && orderIntervalAlertObj.interval.hours !== '0') {
                    var formattedHours = StringUtils.format(jobResources['order.alert.interval.hours'], orderIntervalAlertObj.interval.hours);
                    if (interval) {
                        interval += (orderIntervalAlertObj.interval.minutes.length > 0 && orderIntervalAlertObj.interval.minutes !== '0' ? ', ' : jobResources['common.and']) + automaticNotificationHelper.setPlurality(formattedHours, parseInt(orderIntervalAlertObj.interval.hours, 10));
                    } else {
                        interval += automaticNotificationHelper.setPlurality(formattedHours, parseInt(orderIntervalAlertObj.interval.hours, 10));
                    }
                }
                if (orderIntervalAlertObj.interval.minutes.length > 0 && orderIntervalAlertObj.interval.minutes !== '0') {
                    var formattedMinutes = StringUtils.format(jobResources['order.alert.interval.minutes'], orderIntervalAlertObj.interval.minutes);
                    interval += (interval ? jobResources['common.and'] : '') + automaticNotificationHelper.setPlurality(formattedMinutes, parseInt(orderIntervalAlertObj.interval.minutes, 10));
                }
                var renderedTemplate = renderTemplateHelper.buildHtmlEmailTemplate({
                    messageHeader: StringUtils.format(jobResources['order.alert.message.header'], currentSite.getName() || currentSite.getID(), interval),
                    messageFooter: jobResources['order.alert.message.footer']
                });
                var senderEmail = orderIntervalAlertObj.senderEmail;
                emailHelper.sendMail({
                    from: senderEmail,
                    recipient: orderIntervalAlertObj.recipientEmails,
                    subject: StringUtils.format(jobResources['order.alert.subject'], currentSite.getName() || currentSite.getID()),
                    content: renderedTemplate
                });
                orderIntervalAlertObj.lastNotification = new Date();
                var failedOrderAlert = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.ORDER_INTERVAL_ALERT);
                Transaction.wrap(function () {
                    failedOrderAlert.custom.configuration = JSON.stringify(orderIntervalAlertObj);
                });
                Logger.info('Notification Email has been sent for not createing orders in the last {0}.', interval);
            }
        }
    } else if (!orderIntervalAlertObj.enabled) {
        Logger.info('The (Order Interval Alert) service is not enabled for the current site');
    } else if (orderIntervalAlertObj.notSetup) {
        Logger.info('The (Order Interval Alert) settings are not set up yet in the current site');
    }
    return new Status(Status.OK);
}

exports.execute = execute;
