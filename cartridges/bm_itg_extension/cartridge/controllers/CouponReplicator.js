'use strict';

/**
 * @namespace CouponReplicator
 */

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var ISML = require('dw/template/ISML');
var StringUtils = require('dw/util/StringUtils');

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var app = require('*/cartridge/scripts/util/app');
var couponReplicatorHelper = require('*/cartridge/scripts/helpers/couponReplicatorHelper');
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var responseUtil = require('*/cartridge/scripts/util/responseUtil');
var constants = require('*/cartridge/scripts/helpers/constants');
var PaginationModel = require('*/cartridge/models/paginationModel');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var guard = require('~/cartridge/scripts/util/guard');

/**
 * Show the main page
 */
function start() {
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
            htmlValue: Resource.msg('feature.title', 'couponReplicator', null)
        }
    ];
    try {
        var actionUrl = URLUtils.https('CouponReplicator-GetCouponList');
        var executionListResult = jobServicesHelper.getRecentProcessList([constants.COUPON_REPLICATOR.FIRST_JOB_ID, constants.COUPON_REPLICATOR.SECOND_JOB_ID], constants.COUPON_REPLICATOR.RECENT_PROCESSES_NUMBER);
        if (executionListResult.success) {
            ISML.renderTemplate('couponReplicator/couponReplicator', {
                actionUrl: actionUrl,
                executionList: executionListResult.executionList,
                exportDetailsURL: URLUtils.https('ExecutionList-GetExecutionDetails'),
                serviceType: Resource.msg('service.type', 'couponReplicator', null),
                breadcrumbs: breadcrumbs
            });
        } else {
            Logger.error(Resource.msgf('render.page.error', 'error', null, executionListResult.errorMessage));
            ISML.renderTemplate('common/errorPage', {
                breadcrumbs: breadcrumbs,
                message: executionListResult.errorMessage,
                currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('CouponReplicator-Start').toString(), request.httpQueryString)
            });
        }
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('CouponReplicator-Start').toString(), request.httpQueryString)
        });
    }
}

/**
 * Retrieve the Coupon lists
 */
function getCouponList() {
    var couponSearchForm = app.getRequestFormOrParams();
    var couponSearchTerm = couponSearchForm.couponSearchTerm || '';
    var pageSize = parseInt(couponSearchForm.pageSize, 10);
    var pageNumber = parseInt(couponSearchForm.pageNumber, 10);
    var sortBy = couponSearchForm.sortBy || '';
    var sortRule = couponSearchForm.sortRule || '';

    var responseObj = {
        success: false
    };

    var couponListResult = couponReplicatorHelper.getCouponList(couponSearchTerm, pageSize, pageNumber, sortBy, sortRule);

    if (!couponListResult.error) {
        var paginationParams = {
            type: 'ocapi',
            ocapiObj: couponListResult.data,
            count: pageSize,
            urlPath: 'CouponReplicator-GetCouponList',
            urlParams: {
                couponSearchTerm: couponSearchTerm,
                sortBy: sortBy || '',
                sortRule: sortRule || '',
                pageSize: pageSize || 10
            }
        };
        var paginationModel = new PaginationModel(paginationParams);
        var couponList = !empty(couponListResult.data.hits) ? couponListResult.data.hits : [];

        var resultContext = {
            actionUrl: URLUtils.https('CouponReplicator-ReplicationPage').toString(),
            couponList: couponList,
            paginationModel: paginationModel,
            couponId: couponSearchTerm,
            sortRule: sortRule || '',
            sortBy: sortBy || '',
            totalCount: couponListResult.data.total
        };

        var resultTemplate = 'couponReplicator/couponsSearchResults';
        var renderedTemplate = renderTemplateHelper.getRenderedHtml(
            resultContext,
            resultTemplate
        );

        responseObj = {
            success: true,
            renderedTemplate: renderedTemplate
        };
    } else if (couponListResult.data && couponListResult.data.errorMessage) {
        responseObj = {
            success: false,
            serverErrors: [couponListResult.data.errorMessage]
        };
    } else {
        responseObj = {
            success: false,
            serverErrors: [Resource.msg('error.technical', 'common', null)]
        };
    }

    responseUtil.renderJSON(responseObj);
}

/**
 * Replication Page
 */
function replicationPage() {
    var params = app.getRequestFormOrParams();
    var couponId = params.coupon_id;
    var caseInsensitive = params.case_insensitive;
    var multipleCodesPerBasket = params.multiple_codes_per_basket;
    var couponDescription = params.description || '';
    var couponType = params.type;

    var responseObj = {
        success: false
    };

    var replicationData = couponReplicatorHelper.getCouponReplicationData(couponId);
    var actionUrl = URLUtils.https('CouponReplicator-RunReplicationJob');

    if (!replicationData.error) {
        var resultTemplate = 'couponReplicator/replicationPage';
        var resultContext = {
            actionUrl: actionUrl,
            availableSites: replicationData.availableSites,
            couponId: couponId,
            couponDescription: couponDescription,
            availableSitesCount: replicationData.availableSites ? replicationData.availableSites.length : 0,
            caseInsensitive: caseInsensitive,
            multipleCodesPerBasket: multipleCodesPerBasket,
            couponType: couponType
        };
        var renderedTemplate = renderTemplateHelper.getRenderedHtml(
            resultContext,
            resultTemplate
        );
        responseObj = {
            success: true,
            renderedTemplate: renderedTemplate
        };
    } else if (replicationData.data && replicationData.data.errorMessage) {
        responseObj = {
            success: false,
            serverErrors: [replicationData.data.errorMessage]
        };
    } else {
        responseObj = {
            success: false,
            serverErrors: [Resource.msg('error.technical', 'common', null)]
        };
    }

    responseUtil.renderJSON(responseObj);
}

/**
 * Executes the replication job for a specific coupon by triggering export and import jobs.
 * Retrieves coupon information, prepares job parameters, and triggers the replication process.
 *
*/
function runReplicationJob() {
    var jobExecutionItem = require('~/cartridge/models/jobExecutionItem');
    var params = app.getRequestFormOrParams();
    var couponId = params.couponId;
    var siteIdsObj = params.siteIdsArray;
    var caseInsensitive = params.caseInsensitive;
    var multipleCodesPerBasket = params.multipleCodesPerBasket;
    var couponDescription = params.couponDescription;
    var couponType = params.couponType;

    var responseObj = {
        success: false
    };

    if (!empty(couponId) && !empty(siteIdsObj)) {
        var siteIds = JSON.parse(siteIdsObj);
        var jobResult = couponReplicatorHelper.runCouponReplicatorJob(couponId, siteIds, caseInsensitive, multipleCodesPerBasket, couponType, couponDescription);
        if (jobResult instanceof jobExecutionItem) {
            var resultContext = {
                serviceType: Resource.msg('service.type', 'couponReplicator', null),
                executionDetails: jobResult
            };
            var resultTemplate = 'executionHistory/executionRow';
            var renderedTemplate = renderTemplateHelper.getRenderedHtml(
                resultContext,
                resultTemplate
            );
            responseObj = {
                success: true,
                renderedTemplate: renderedTemplate
            };
        } else if (jobResult.data && jobResult.data.errorMessage) {
            responseObj = {
                success: false,
                serverErrors: [jobResult.data.errorMessage]
            };
        } else {
            responseObj = {
                success: false,
                serverErrors: [Resource.msg('error.technical', 'common', null)]
            };
        }
    }

    responseUtil.renderJSON(responseObj);
}

/** Renders the landing page of "Coupon Replicator" module.
 * @see module:controllers/CouponReplicator~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Shows replication page details.
 * @see module:controllers/CouponReplicator~ReplicationPage */
exports.ReplicationPage = guard.ensure(['https', 'get', 'csrf'], replicationPage);
/** Run replication process for a specific selected coupon.
 * @see module:controllers/CouponReplicator~RunReplicationJob */
exports.RunReplicationJob = guard.ensure(['https', 'post', 'csrf'], runReplicationJob);
/** Gets the coupon List of a specific site.
 * @see module:controllers/CouponReplicator~GetCouponList */
exports.GetCouponList = guard.ensure(['https', 'get', 'csrf'], getCouponList);

