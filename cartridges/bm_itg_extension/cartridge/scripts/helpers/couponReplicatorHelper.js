'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');

var constants = require('~/cartridge/scripts/helpers/constants');
var jobServicesHelper = require('~/cartridge/scripts/helpers/jobServicesHelper');
var ocapi = require('~/cartridge/scripts/util/ocapi');

/**
 * Retrieves a list of coupons based on the specified search term.
 *
 * @param {string} couponSearchTerm - Coupon search term
 * @param {int} pageSize - Page size
 * @param {int} pageNumber - Page Number
 * @param {string} sortBy - Sort by
 * @param {string} sortRule - Sort rule
 * @returns {Object} - Response object from the coupon search API.
 * */
function getCouponList(couponSearchTerm, pageSize, pageNumber, sortBy, sortRule) {
    var ocapiResponse = new ocapi.RequestBuilder()
        .setOcapi(ocapi.ENDPOINTS.COUPON_SEARCH)
        .setQuery({ bool_query: { must: [{ text_query: { fields: ['id'], search_phrase: couponSearchTerm || '**' } }],
            must_not: [{ text_query: { fields: ['type'], search_phrase: 'single_code' } }] }
        })
        .selectOnlySpecificAttributes('search', ['coupon_id', 'type', 'total_codes_count', 'enabled', 'case_insensitive', 'multiple_codes_per_basket', 'description'])
        .expandToMoreAttributes('stats')
        .setPageSize(pageSize || 10)
        .setPageNumber(pageNumber ? pageNumber - 1 : 0)
        .sortBy({
            field: sortBy || 'coupon_id',
            sort_order: sortRule || 'asc'
        })
        .execute();

    return ocapiResponse;
}

/**
 * Get the content of replication popup
 * @param {string} couponId - Coupon code to be replicated
 * @returns {Object} result - Replication data
 */
function getCouponReplicationData(couponId) {
    var allSites = Site.getAllSites();
    var ocapiBatchRequest = new ocapi.BatchBuilder();

    allSites.toArray().forEach(function (site) {
        if (site.getID() !== Site.getCurrent().getID()) {
            ocapiBatchRequest.addRequest(new ocapi.RequestBuilder()
                .setRequestId(site.getID())
                .setOcapi(ocapi.ENDPOINTS.COUPON_GET_BY_ID)
                .addParameters(site.getID(), couponId));
        }
    });

    var result = ocapiBatchRequest.execute();

    var errorResult = ocapi.utils.getBatchResponseError(result);

    var availableSites = [];
    if (!errorResult) {
        if (!empty(result.responseList)) {
            allSites.toArray().forEach(function (site) {
                var coupon = result.responseList[site.getID()];
                if (!empty(coupon)) {
                    availableSites.push({
                        siteId: site.getID(),
                        siteName: site.getName(),
                        disabled: !empty(coupon.data)
                    });
                }
            });
        }
        return {
            availableSites: availableSites
        };
    }

    return errorResult;
}

/**
 * Initiates the execution of a job to export coupons for a specified coupon ID and set of site IDs.
 *
 * @param {string} couponId - The ID of the coupon to be exported.
 * @param {Array} siteIds - An array of site IDs for which the coupon should be exported.
 * @param {string} caseInsensitive - Coupon caseInsensitive param.
 * @param {string} multipleCodesPerBasket - Coupon multipleCodesPerBasket param.
 * @param {string} couponType - Coupon type param.
 * @param {string} couponDescription - Coupon Description param.
 * @returns {Object} - The response object containing details of the export operation.
 */
function runCouponReplicatorJob(couponId, siteIds, caseInsensitive, multipleCodesPerBasket, couponType, couponDescription) {
    var currentSite = Site.getCurrent();
    var currentSiteID = currentSite.ID;
    var jobParams = {
        ReplicatedCouponId: couponId,
        SiteID: currentSiteID,
        CouponId: couponId,
        CaseInsensitive: caseInsensitive + '',
        CouponCodeType: couponType,
        Description: escape(couponDescription),
        MultipleCodesPerBasket: multipleCodesPerBasket + '',
        SiteScope: JSON.stringify({ named_sites: [currentSiteID] }),
        SitesScope: JSON.stringify({ named_sites: siteIds }),
        ExportFileName: StringUtils.format('{0}{1}/coupon_codes', constants.COUPON_REPLICATOR.IMPEX_PATH, currentSiteID)
    };

    Logger.debug(Resource.msg('start.coupon.export.job', 'couponReplicator', null));

    var jobExecution = jobServicesHelper.executeJob(constants.COUPON_REPLICATOR.FIRST_JOB_ID, jobParams);

    if (!jobExecution.error) {
        jobExecution.jobIds = [constants.COUPON_REPLICATOR.FIRST_JOB_ID, constants.COUPON_REPLICATOR.SECOND_JOB_ID];
    }

    return jobExecution;
}

/**
 * Initiates the execution of a job to import coupons for a given set of site IDs.
 *
 * @param {string[]} siteIds - An array of site IDs for which coupons should be imported.
 * @param {string} SiteID - The specific site ID for which coupons are being imported.
 * @returns {Object} - The job execution details, including status and any error messages.
 */
function runCouponReplicatorJob2(siteIds, SiteID) {
    var jobParams = {
        SiteScope: siteIds,
        WorkingFolder: constants.COUPON_REPLICATOR.IMPEX_PATH + SiteID + '/'
    };

    return jobServicesHelper.executeJob(constants.COUPON_REPLICATOR.SECOND_JOB_ID, jobParams);
}

exports.runCouponReplicatorJob2 = runCouponReplicatorJob2;
exports.runCouponReplicatorJob = runCouponReplicatorJob;
exports.getCouponList = getCouponList;
exports.getCouponReplicationData = getCouponReplicationData;
