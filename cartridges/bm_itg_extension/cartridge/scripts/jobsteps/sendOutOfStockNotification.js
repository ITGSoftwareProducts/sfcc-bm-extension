'use strict';

/**
 * Checks for products inventory and sends an email accordingly.
 * @returns {dw.system.Status} status
 */
function execute() {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Transaction = require('dw/system/Transaction');
    var StringUtils = require('dw/util/StringUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var emailHelper = require('~/cartridge/scripts/helpers/emailHelper');
    var automaticNotificationHelper = require('~/cartridge/scripts/helpers/automaticNotificationHelper');
    var renderTemplateHelper = require('~/cartridge/scripts/renderTemplateHelper');
    var constants = require('~/cartridge/scripts/helpers/constants');
    var jobResources = require('~/cartridge/scripts/util/jobResources');
    var currentSite = require('dw/system/Site').getCurrent();

    var outOfStockNotificationsObj = automaticNotificationHelper.getOOSNotificationSettings();
    if (outOfStockNotificationsObj.enabled && !outOfStockNotificationsObj.notSetup && !empty(outOfStockNotificationsObj.productArray)) {
        Logger.info('Start checking the products availability');
        var productIds = [];
        for (var i = 0; i < outOfStockNotificationsObj.productArray.length; i++) {
            var productID = outOfStockNotificationsObj.productArray[i];
            // TODO: For better performance, use a search-index-based script API instead of ProductMgr API
            var product = ProductMgr.getProduct(productID);
            var avm = product ? product.getAvailabilityModel() : null;
            try {
                if (product && !empty(avm)) {
                    if (outOfStockNotificationsObj.products[product.ID] === constants.AUTOMATED_NOTIFICATION_SYSTEM.PRODUCT_STATUS.NOT_NOTIFIED) {
                        if (!avm.inventoryRecord || (avm.inventoryRecord.ATS.value === 0 && !avm.inventoryRecord.isPerpetual())) {
                            Logger.info('Product {0} is out of stock', product.ID);
                            outOfStockNotificationsObj.products[product.ID] = constants.AUTOMATED_NOTIFICATION_SYSTEM.PRODUCT_STATUS.NOTIFIED;
                            productIds.push(product.ID);
                        }
                    } else if (avm.inventoryRecord && avm.inventoryRecord.ATS.value > 0) {
                        Logger.info('Product {0} is back in stock', product.ID);
                        outOfStockNotificationsObj.products[product.ID] = constants.AUTOMATED_NOTIFICATION_SYSTEM.PRODUCT_STATUS.NOT_NOTIFIED;
                    }
                }
            } catch (e) {
                Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
            }
        }

        if (!empty(productIds)) {
            var dataColumns = [jobResources['oos.email.column1']];
            var formattedHeader = StringUtils.format(jobResources['oos.email.message.header'], currentSite.getName() || currentSite.getID());
            var renderedTemplate = renderTemplateHelper.buildHtmlEmailTemplate({
                messageHeader: automaticNotificationHelper.setPlurality(formattedHeader, productIds.length),
                messageFooter: jobResources['oos.email.message.footer'],
                columns: dataColumns,
                list: productIds
            });
            var senderEmail = outOfStockNotificationsObj.senderEmail;
            emailHelper.sendMail({
                recipient: outOfStockNotificationsObj.recipientEmails,
                from: senderEmail,
                subject: StringUtils.format(jobResources['oos.email.subject'], currentSite.getName() || currentSite.getID()),
                content: renderedTemplate
            });

            var outOfStockNotification = CustomObjectMgr.getCustomObject(constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECT_TYPE, constants.AUTOMATED_NOTIFICATION_SYSTEM.CUSTOM_OBJECTS.OUT_OF_STOCK_NOTIFICATION);
            Transaction.wrap(function () {
                outOfStockNotification.custom.configuration = JSON.stringify(outOfStockNotificationsObj);
            });
            Logger.info('Notification Email has been sent for the following OOS product(s) {0}', productIds.join(','));
        }
    } else if (!outOfStockNotificationsObj.enabled) {
        Logger.info('The (OOS notification) service is not enabled for the current site');
    } else if (outOfStockNotificationsObj.notSetup || empty(outOfStockNotificationsObj.productArray)) {
        Logger.info('The (OOS notification) settings are not set up yet in the current site');
    }
    return new Status(Status.OK);
}

exports.execute = execute;
