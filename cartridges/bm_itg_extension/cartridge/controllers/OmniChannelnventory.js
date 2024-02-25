/* eslint-disable no-undef */
'use strict';

var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var ociInventoryHelper = require('~/cartridge/scripts/helpers/ociInventoryHelper');
var responseUtil = require('*/cartridge/scripts/util/responseUtil');
var guard = require('~/cartridge/scripts/util/guard');
var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var configurationHelper = require('*/cartridge/scripts/helpers/configurationHelper');

/**
 * Show OCI Inventory main page
 */
function start() {
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
            htmlValue: Resource.msg('feature.title', 'oci', null)
        }
    ];

    try {
        var isOciInventoryIntegrationMode = configurationHelper.isOciInventoryIntegrationMode();
        if (!isOciInventoryIntegrationMode) {
            var errorMessage = Resource.msg('error.oci.not.available', 'error', null);
            Logger.info(errorMessage);
            ISML.renderTemplate('common/errorPage', {
                breadcrumbs: breadcrumbs,
                message: errorMessage,
                currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('OmniChannelnventory-Start').toString(), request.httpQueryString)
            });
            return;
        }

        var groupsAndLocations = ociInventoryHelper.getGroupsAndLocations().groupsAndLocations;
        if (empty(groupsAndLocations)) {
            var syncErrorMessage = Resource.msg('error.oci.not.synced', 'error', null);
            Logger.info(syncErrorMessage);
            ISML.renderTemplate('common/errorPage', {
                breadcrumbs: breadcrumbs,
                message: syncErrorMessage,
                currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('OmniChannelnventory-Start').toString(), request.httpQueryString)
            });
            return;
        }

        var updateRecordActionUrl = URLUtils.https('OmniChannelnventory-UpdateOrAddInventoryRecord');
        var searchInventoryActionUrl = URLUtils.https('OmniChannelnventory-SearchInventoryRecords');

        ISML.renderTemplate('oci/ociInventoryLandingPage', {
            updateRecordActionUrl: updateRecordActionUrl,
            searchInventoryActionUrl: searchInventoryActionUrl,
            groupsAndLocations: groupsAndLocations,
            breadcrumbs: breadcrumbs
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('OmniChannelnventory-Start').toString(), request.httpQueryString)
        });
    }
}

/**
 * Update inventory record
 */
function updateOrAddInventoryRecord() {
    var app = require('*/cartridge/scripts/util/app');
    var params = app.getRequestFormOrParams();
    var productId = params.productId.trim() || '';
    var product = ProductMgr.getProduct(productId);
    var responseObj;
    if (!(product)) {
        responseObj = {
            success: false,
            productErrorMessage: Resource.msgf('invalid.new.product.id', 'oci', null, productId)
        };
    } else {
        try {
            var ociResponse = ociInventoryHelper.updateOrAddInventoryRecord(params);
            if (!ociResponse.error) {
                responseObj = {
                    success: true
                };
            } else {
                responseObj = {
                    success: false,
                    errorMessage: ociResponse.errors ? [ociResponse.errors.message] : [ociResponse.message]
                };
            }
        } catch (e) {
            Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
            ISML.renderTemplate('common/errorPage', {
                message: e.message,
                currentUrl: URLUtils.https('OmniChannelnventory-Start')
            });
        }
    }
    responseUtil.renderJSON(responseObj);
}

/**
 * Search inventory record
 */
function searchInventoryRecords() {
    var ArrayList = require('dw/util/ArrayList');
    var app = require('*/cartridge/scripts/util/app');
    var params = app.getRequestFormOrParams();
    var searchTerm = params.searchTerm || '';
    var pageSize = parseInt(params.pageSize, 10) || 10;
    var pageNumber = parseInt(params.pageNumber, 10) || 1;
    var responseObj = { success: true };
    var productIds = searchTerm.split(',');
    var resultTemplate = 'oci/ociInventoryResults';
    var renderedTemplate = renderTemplateHelper.getRenderedHtml({}, resultTemplate);
    var constants = require('~/cartridge/scripts/helpers/constants');
    var maxSearchItems = constants.OMNI_CHANNEL_INVENTORY.MAX_SEARCH_ITEAMS;
    var invalidProducts = [];
    var validProducts = [];

    for (var j = 0; j < productIds.length; j++) {
        var productId = productIds[j].trim();
        if (!empty(productId)) {
            var product = ProductMgr.getProduct(productId);
            if (!(product)) {
                invalidProducts.push(productId);
            } else {
                validProducts.push(productId);
            }
        }
    }

    if (!empty(invalidProducts)) {
        responseObj = {
            success: false,
            errorMessage: Resource.msgf('invalid.product.id', 'oci', null, invalidProducts.join(', ')),
            renderedTemplate: renderedTemplate
        };
    } else if (validProducts.length > maxSearchItems) {
        responseObj = {
            success: false,
            errorMessage: Resource.msgf('product.search.limit', 'oci', null, maxSearchItems),
            renderedTemplate: renderedTemplate
        };
    }
    if (responseObj.success) {
        var ociResult = ociInventoryHelper.searchInventory(validProducts);
        var records = ociResult.records;
        if (!empty(records)) {
            var getRecordDetailsUrl = URLUtils.https('OmniChannelnventory-GetRecordDetails');
            var groupsAndLocations = ociInventoryHelper.getGroupsAndLocations().groupsAndLocations;

            var PaginationModel = require('*/cartridge/models/paginationModel');
            var paginationParams = {
                type: 'script',
                responseObj: {
                    items: new ArrayList(records)
                },
                urlPath: 'OmniChannelnventory-SearchInventoryRecords',
                pageNumber: pageNumber,
                urlParams: {
                    searchTerm: searchTerm,
                    pageSize: pageSize
                }
            };
            var recordsPagingModel = new PaginationModel(paginationParams);
            renderedTemplate = renderTemplateHelper.getRenderedHtml(
                {
                    records: records,
                    getRecordDetailsUrl: getRecordDetailsUrl,
                    groupsAndLocations: groupsAndLocations,
                    paginationModel: recordsPagingModel
                }, resultTemplate);
            responseObj = {
                success: true,
                renderedTemplate: renderedTemplate
            };
        } else {
            responseObj = {
                success: false
            };
        }
    }
    responseUtil.renderJSON(responseObj);
}

/**
 * Search inventory record
 */
function getRecordDetails() {
    var app = require('*/cartridge/scripts/util/app');
    var params = app.getRequestFormOrParams();
    var productId = params.productId || '';
    var inventoryId = params.inventoryId || '';
    var ociResult = ociInventoryHelper.searchInventory([productId], inventoryId);
    var records = ociResult.records;
    var resultTemplate = 'oci/ociProductDetails';
    var responseObj;
    if (!empty(records)) {
        var renderedTemplate = renderTemplateHelper.getRenderedHtml({
            record: records ? records[0] : null
        }, resultTemplate);

        responseObj = {
            success: true,
            isGroup: ociResult.isGroup,
            inventoryId: ociResult.inventoryId,
            renderedTemplate: renderedTemplate
        };
    } else {
        responseObj = {
            success: false,
            serverErrors: [ociResult.errorMessage]
        };
    }
    responseUtil.renderJSON(responseObj);
}

/** Renders the landing page of "OCI Data Management Interface" module.
 * @see module:controllers/OmniChannelnventory~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Updates omni-channel inventory record.
 * @see module:controllers/OmniChannelnventory~UpdateOrAddInventoryRecord */
exports.UpdateOrAddInventoryRecord = guard.ensure(['https', 'post', 'csrf'], updateOrAddInventoryRecord);
/** Searchs for omni-channel inventory record.
 * @see module:controllers/OmniChannelnventory~SearchInventoryRecords */
exports.SearchInventoryRecords = guard.ensure(['https', 'get', 'csrf'], searchInventoryRecords);
/** Gets the details of an omni-channel inventory record.
 * @see module:controllers/OmniChannelnventory~GetRecordDetails */
exports.GetRecordDetails = guard.ensure(['https', 'get', 'csrf'], getRecordDetails);

