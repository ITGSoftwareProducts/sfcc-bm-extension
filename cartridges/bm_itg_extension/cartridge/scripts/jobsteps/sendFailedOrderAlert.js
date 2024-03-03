'use strict';


var orderList = [];
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

/**
 * Process order.
 * @param {dw.order.Order} order - Order
*/
function processOrder(order) {
    var calendar = new Calendar(new Date(order.creationDate));
    calendar.setTimeZone(Site.current.getTimezone());
    var orderCreationDate = StringUtils.formatCalendar(calendar, 'EEE, dd MMM yyyy HH:mm:ss z');
    orderList.push([order.orderNo, orderCreationDate]);
}

/**
 * Checks for orders failure in specific interval and sends an email accordingly.
 * @returns {dw.system.Status} status
 */
function execute() {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var automaticNotificationHelper = require('~/cartridge/scripts/helpers/automaticNotificationHelper');
    var renderTemplateHelper = require('~/cartridge/scripts/renderTemplateHelper');
    var constants = require('~/cartridge/scripts/helpers/constants');
    var jobResources = require('~/cartridge/scripts/util/jobResources');
    var emailHelper = require('~/cartridge/scripts/helpers/emailHelper');

    var failedOrderAlertObj = automaticNotificationHelper.getFailedOrderAlertSettings();
    if (failedOrderAlertObj.enabled && !failedOrderAlertObj.notSetup) {
        var isAlertSent = false;
        if (failedOrderAlertObj.lastNotification) {
            var lastNotification = new Calendar(new Date(failedOrderAlertObj.lastNotification));
            lastNotification.add(Calendar.DAY_OF_MONTH, parseInt(failedOrderAlertObj.interval.days, 10));
            lastNotification.add(Calendar.HOUR_OF_DAY, parseInt(failedOrderAlertObj.interval.hours, 10));
            lastNotification.add(Calendar.MINUTE, parseInt(failedOrderAlertObj.interval.minutes, 10));
            var currentTime = new Calendar(new Date());
            if (currentTime.time < lastNotification.time) {
                Logger.info('The (Failed Order Alert) were already sent at {0}', failedOrderAlertObj.lastNotification);
                isAlertSent = true;
            }
        }
        if (!isAlertSent) {
            try {
                Logger.info('Start checking the orders failure status in latest specific interval');
                var dateAfter = new Calendar(new Date());
                dateAfter.add(Calendar.DAY_OF_MONTH, -parseInt(failedOrderAlertObj.interval.days, 10));
                dateAfter.add(Calendar.HOUR_OF_DAY, -parseInt(failedOrderAlertObj.interval.hours, 10));
                dateAfter.add(Calendar.MINUTE, -parseInt(failedOrderAlertObj.interval.minutes, 10));
                var queryString = 'creationDate >= {0} AND status = {1}';
                OrderMgr.processOrders(processOrder, queryString, dateAfter.getTime(), Order.ORDER_STATUS_FAILED);
            } catch (e) {
                Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
            }
            if (orderList && orderList.length >= failedOrderAlertObj.countThreshold) {
                Logger.info('There are {0} failing orders in latest specific interval.', orderList.length);
                var interval = '';
                if (failedOrderAlertObj.interval.days !== 0) {
                    interval += StringUtils.format(jobResources['order.alert.interval.days'], failedOrderAlertObj.interval.days);
                }
                if (failedOrderAlertObj.interval.hours !== 0) {
                    if (interval) {
                        interval += (failedOrderAlertObj.interval.minutes !== 0 ? ', ' : jobResources['common.and']) + StringUtils.format(jobResources['order.alert.interval.hours'], failedOrderAlertObj.interval.hours);
                    } else {
                        interval += StringUtils.format(jobResources['order.alert.interval.hours'], failedOrderAlertObj.interval.hours);
                    }
                }
                if (failedOrderAlertObj.interval.minutes !== 0) {
                    interval += (interval ? jobResources['common.and'] : '') + StringUtils.format(jobResources['order.alert.interval.minutes'], failedOrderAlertObj.interval.minutes);
                }
                if (!empty(orderList)) {
                    var dataColumns = [
                        jobResources['failedorder.email.column1'],
                        jobResources['failedorder.email.column2']
                    ];
                    var renderedTemplate = renderTemplateHelper.buildHtmlEmailTemplate({
                        messageHeader: jobResources['failedorder.email.message.header'],
                        messageFooter: jobResources['failedorder.email.message.footer'],
                        columns: dataColumns,
                        list: orderList
                    });
                    var senderEmail = failedOrderAlertObj.senderEmail;
                    emailHelper.sendMail({
                        recipient: failedOrderAlertObj.recipientEmails,
                        from: senderEmail,
                        subject: jobResources['failedorder.email.subject'],
                        content: renderedTemplate
                    });
                    failedOrderAlertObj.lastNotification = new Date();
                    var failedOrderAlert = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.FAILED_ORDER_ALERT);
                    Transaction.wrap(function () {
                        failedOrderAlert.custom.configuration = JSON.stringify(failedOrderAlertObj);
                    });
                    Logger.info('Notification Email has been sent for {0} failing orders in the last {1}.', orderList.length, interval);
                }
            }
        }
    } else if (!failedOrderAlertObj.enabled) {
        Logger.info('The (Failed Order Alert) service is not enabled for the current site');
        return new Status(Status.OK);
    } else if (failedOrderAlertObj.notSetup) {
        Logger.info('The (Failed Order Alert) settings are not set up yet in the current site');
        return new Status(Status.OK);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
