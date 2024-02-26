'use strict';

var ProductList = require('dw/customer/ProductList');

module.exports = {

    COUPON_REPLICATOR: Object.freeze({
        IMPEX_PATH: '/bm-extension/CouponReplicator/',
        FIRST_JOB_ID: 'BM Extension - Coupon Replicator: Producer',
        SECOND_JOB_ID: 'BM Extension - Coupon Replicator: Consumer',
        CODES_FILENAME: 'coupon_codes.xml',
        EXPORTED_FILENAME: 'code_to_be_replicated.xml',
        RECENT_PROCESSES_NUMBER: 10,
        COUPON_TYPES: {
            MULTIPLE_CODE: 'Multiple Codes',
            SYSTEM_CODE: 'System-Generated'
        }
    }),

    OMNI_CHANNEL_INVENTORY: Object.freeze({
        IMPEX_PATH: '/bm-extension/OCI/',
        GROUPS_AND_LOCATIONS_FOLDER: 'GroupsAndLocations/',
        GROUPS_AND_LOCATIONS_FILE: 'GroupsAndLocations.json',
        MAX_SEARCH_ITEAMS: 100
    }),

    PAGE_DESIGNER_EXPORT: Object.freeze({
        JOB_ID: 'BM Extension - Page Designer Export',
        RECENT_PROCESSES_NUMBER: 5,
        IMPEX_PATH: '{0}/src/bm-extension/PDPageExport/{1}/Output/',
        EXPORT_PATH_URL: '/bm-extension/PDPageExport/{0}',
        HASH_MAP_MAX_SIZE: 11999
    }),

    CUSTOMER_PRODUCTLIST: Object.freeze({
        LIST_TYPES: [{
            name: 'Custom List 1',
            value: ProductList.TYPE_CUSTOM_1
        },
        {
            name: 'Custom List 2',
            value: ProductList.TYPE_CUSTOM_2
        },
        {
            name: 'Custom List 3',
            value: ProductList.TYPE_CUSTOM_3
        },
        {
            name: 'Gift Registry',
            value: ProductList.TYPE_GIFT_REGISTRY
        },
        {
            name: 'Shopping List',
            value: ProductList.TYPE_SHOPPING_LIST
        },
        {
            name: 'Wish List',
            value: ProductList.TYPE_WISH_LIST
        }]
    }),

    AUTOMATED_NOTIFICATION_SYSTEM: Object.freeze({
        CUSTOM_OBJECT_TYPE: 'AutomaticNotificationSettings',
        CUSTOM_OBJECTS: {
            OUT_OF_STOCK_NOTIFICATION: 'outOfStockNotification',
            ORDER_INTERVAL_ALERT: 'orderIntervalAlert',
            FAILED_ORDER_ALERT: 'failedOrderAlert',
            CAMPAIGN_NOTIFICATION: 'campaignManagementNotification'
        },
        PRODUCT_STATUS: {
            NOTIFIED: 'notified',
            NOT_NOTIFIED: 'not-notified'
        }
    }),

    CSV_IMPORT_EXPORT: Object.freeze({
        DATA_TYPES: {
            INVENTORY: 'inventory',
            PRICEBOOK: 'priceBook'
        },
        DATA_MAPPING: {
            CUSTOM_OBJECT_TYPE: 'CSVMappingConfigType'
        },
        JOB_ID: 'BM Extension - CSV Import Export',
        RECENT_PROCESSES_NUMBER: 10,
        PRODUCT_MENU: 'prod-cat',
        CUSTOMER_MENU: 'customers',
        MARKETING_MENU: 'marketing',
        IMPEX_PATH: '{0}/src/bm-extension/CSV_IMPEX/{1}/Export/CSV/',
        MIN_MAPPING_LENGTH: 2
    }),

    GLOBAL: Object.freeze({
        EXECUTION_LIST: {
            FILES_MAP: {
                'BM Extension - Coupon Replicator: Producer': 'CouponId',
                'BM Extension - Page Designer Export': 'ExportFileName',
                'BM Extension - CSV Import Export': 'ExportFileName'
            }
        },
        BM_EXTENSION: {
            ATTRIBUTE_GROUP: 'BM Extension'
        }
    })
};
