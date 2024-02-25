'use strict';

var ocapiEnums = function () { };

ocapiEnums.HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST'
};

ocapiEnums.TYPES = {
    BATCH: 'batch',
    DATA: 'data'
};

ocapiEnums.ENDPOINTS = {
    COUPON_SEARCH: {
        api: 'coupon_search',
        method: ocapiEnums.HTTP_METHODS.POST,
        siteSpecific: true,
        type: ocapiEnums.TYPES.DATA,
        supportsPagination: true
    },
    COUPON_GET_BY_ID: {
        api: 'sites/{0}/coupons/{1}',
        method: ocapiEnums.HTTP_METHODS.GET,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA
    },
    JOB_EXECUTION_SEARCH: {
        api: 'job_execution_search',
        method: ocapiEnums.HTTP_METHODS.POST,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA,
        supportsPagination: true
    },
    EXECUTION_DETAILS: {
        api: 'jobs/{0}/executions/{1}',
        method: ocapiEnums.HTTP_METHODS.GET,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA
    },
    EXECUTE_JOB: {
        api: 'jobs/{0}/executions',
        method: ocapiEnums.HTTP_METHODS.POST,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA
    },
    INVENTORY_LIST: {
        api: 'inventory_lists',
        method: ocapiEnums.HTTP_METHODS.GET,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA,
        supportsPagination: true
    },
    ATTRIBUTE_DEFINITIONS: {
        api: 'system_object_definitions/{0}/attribute_definitions',
        method: ocapiEnums.HTTP_METHODS.GET,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA,
        supportsPagination: true
    },
    CAMPAIGN_NOTIFICATION: {
        api: 'campaign_search',
        method: ocapiEnums.HTTP_METHODS.POST,
        siteSpecific: true,
        type: ocapiEnums.TYPES.DATA
    },
    SYSTEM_ATTRIBUTE_DETAILS: {
        api: 'system_object_definitions/{0}/attribute_definitions/{1}',
        method: ocapiEnums.HTTP_METHODS.GET,
        siteSpecific: false,
        type: ocapiEnums.TYPES.DATA,
        supportsPagination: true
    }
};

ocapiEnums.OCAPI_BATCH_SEPARATOR = '--#separator$_@';

module.exports = ocapiEnums;
