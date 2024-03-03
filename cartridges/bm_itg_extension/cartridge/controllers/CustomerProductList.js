'use strict';

/**
 * @namespace CustomerProductList
 */

var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var ProductListMgr = require('dw/customer/ProductListMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Resource = require('dw/web/Resource');
var ISML = require('dw/template/ISML');
var constants = require('*/cartridge/scripts/helpers/constants');
var productListHelper = require('*/cartridge/scripts/helpers/productListHelper');
var responseUtil = require('*/cartridge/scripts/util/responseUtil');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
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
            htmlValue: Resource.msg('breadcrumb.products.customers.title', 'common', null),
            url: URLUtils.https('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'customers')
        },
        {
            htmlValue: Resource.msg('breadcrumb.customer.productlist.title', 'customerProductLists', null)
        }
    ];
    try {
        var actionUrl = URLUtils.https('CustomerProductList-GetList');

        ISML.renderTemplate('customerProductList/customerProductList', {
            actionUrl: actionUrl,
            productListTypes: constants.CUSTOMER_PRODUCTLIST.LIST_TYPES,
            breadcrumbs: breadcrumbs
        });
    } catch (e) {
        Logger.error(Resource.msgf('render.page.error', 'error', null, e.message));
        ISML.renderTemplate('common/errorPage', {
            breadcrumbs: breadcrumbs,
            message: e.message,
            currentUrl: StringUtils.format('{0}?{1}', URLUtils.https('CustomerProductList-Start').toString(), request.httpQueryString)
        });
    }
}


/**
 * Retrieve the the product lists of a customer
 */
function getList() {
    var PaginationModel = require('*/cartridge/models/paginationModel');
    var app = require('*/cartridge/scripts/util/app');
    var customerProductListForm = app.getRequestFormOrParams();
    var searchTerm = customerProductListForm.searchTerm;
    var listId = customerProductListForm.listId;
    var productListType = parseInt(customerProductListForm.productListType, 10);
    var pageSize = parseInt(customerProductListForm.pageSize, 10) || 10;
    var pageNumber = parseInt(customerProductListForm.pageNumber, 10) || 1;

    searchTerm = searchTerm ? searchTerm.replace(/\s+/g, '') : '';
    var emailRegex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    var customer;
    if (searchTerm.match(emailRegex)) {
        customer = CustomerMgr.getCustomerByLogin(searchTerm);
    } else {
        customer = CustomerMgr.getCustomerByCustomerNumber(searchTerm);
    }
    var responseObj = {
        success: true
    };
    var resultTemplate = 'customerProductList/productList';
    var resultContext;
    if (customer) {
        var productLists = [];

        if (!empty(productListType)) {
            var productListsObj = ProductListMgr.getProductLists(customer, productListType);
            productLists = productListsObj.length > 0 ? productListsObj : [];
        }

        if (productLists.length > 0) {
            var list = productListHelper.getSelectedProductList(productLists, listId);
            var paginationParams = {
                type: 'script',
                responseObj: list,
                urlPath: 'CustomerProductList-GetList',
                pageNumber: pageNumber,
                urlParams: {
                    searchTerm: searchTerm,
                    productListType: productListType,
                    pageSize: pageSize || 10,
                    listId: listId || ''
                }
            };
            var productListsPagingModel = new PaginationModel(paginationParams);
            resultContext = {
                productLists: productLists,
                paginationModel: productListsPagingModel,
                searchTerm: searchTerm,
                selectedListId: listId
            };
            responseObj.success = true;
        } else {
            resultContext = {
                message: Resource.msg('no.productlist.associated.with.this.customer.number', 'customerProductLists', null),
                paginationModel: []
            };
        }
    } else {
        resultContext = {
            message: Resource.msg('no.customer.associated.for.this.number', 'customerProductLists', null),
            paginationModel: []
        };
    }
    var renderedTemplate = renderTemplateHelper.getRenderedHtml(resultContext, resultTemplate);
    responseObj.renderedTemplate = renderedTemplate;

    responseUtil.renderJSON(responseObj);
}

/** Renders the landing page of "Customer Product Lists" module.
 * @see module:controllers/CustomerProductList~Start */
exports.Start = guard.ensure(['https', 'get', 'csrf'], start);
/** Gets a customer product list.
 * @see module:controllers/CustomerProductList~GetList */
exports.GetList = guard.ensure(['https', 'get', 'csrf'], getList);
