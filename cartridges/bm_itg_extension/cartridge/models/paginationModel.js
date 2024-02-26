'use strict';
var PagingModel = require('dw/web/PagingModel');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelper');
const defaultCount = 10;
const skipCount = 6;

/**
 * Creates a pagination model based on the provided pagination parameters.
 *
 * @param {Object} paginationParams - The parameters for pagination.
 */
function PaginationModel(paginationParams) {
    var start;
    var totalCount = '';
    var pageSize;
    var pageCount;
    var currentPage;
    var itemNumber;
    var itemPerPage;
    var pageSizeUrl;
    var url;
    if (paginationParams.type === 'ocapi' && !empty(paginationParams.ocapiObj)) {
        var ocapiObj = paginationParams.ocapiObj;
        start = ocapiObj.start;
        totalCount = ocapiObj.total;
        pageSize = paginationParams.urlParams.pageSize || defaultCount;
        pageCount = Math.ceil(totalCount / pageSize);
        currentPage = (start / pageSize);
        if (currentPage === 0) {
            currentPage = 1;
        } else {
            currentPage += 1;
        }
        itemNumber = ocapiObj.hits ? ocapiObj.hits.length : 0;
        itemPerPage = ((currentPage - 1) * pageSize) + 1;
    } else if (paginationParams.type === 'script' && paginationParams.responseObj) {
        var pagingModel = new PagingModel(paginationParams.responseObj.items);
        pagingModel.setPageSize(paginationParams.urlParams.pageSize);
        pagingModel.setStart(paginationParams.urlParams.pageSize * (paginationParams.pageNumber - 1));
        start = pagingModel.start;
        totalCount = pagingModel.count;
        pageSize = paginationParams.urlParams.pageSize;
        pageCount = pagingModel.pageCount;
        currentPage = (start / pageSize) + 1;
        var list = pagingModel.pageElements.asList();
        itemNumber = list.length;
        itemPerPage = ((currentPage - 1) * pageSize) + 1;
        this.pageElements = pagingModel.pageElements;
    }

    var urlParams = paginationParams.urlParams;
    url = urlHelper.addParamsToUrl(paginationParams.urlPath, urlParams);
    delete urlParams.pageSize;
    pageSizeUrl = urlHelper.addParamsToUrl(paginationParams.urlPath, urlParams);

    var startPage = 1;
    var endPage = skipCount;
    if (skipCount - currentPage > 0) {
        startPage = 1;
    } else if (pageCount <= skipCount && currentPage - skipCount === 0) {
        startPage = 1;
        endPage = skipCount;
    } else if (currentPage > (pageCount - skipCount)) {
        startPage = pageCount - skipCount > 1 ? pageCount - skipCount : 2;
        endPage = pageCount;
    } else if (Math.abs(skipCount - currentPage) > 0 || skipCount - currentPage === 0) {
        startPage = currentPage - (skipCount / 2);
        endPage = currentPage + (skipCount / 2);
    }
    this.displayedItem = ((currentPage - 1) * pageSize) + itemNumber;
    this.itemPerPage = itemPerPage;
    this.pageCount = pageCount;
    this.pageSize = pageSize;
    this.totalCount = totalCount;
    this.start = start;
    this.currentPage = currentPage;
    this.skipCount = skipCount;
    this.itemNumber = itemNumber;
    this.defaultPageSize = [10, 25, 50, 100, 150, 200];
    this.selectedPage = pageSize;
    this.startPage = startPage;
    this.endPage = endPage;
    this.url = url;
    this.pageSizeUrl = pageSizeUrl;
}
module.exports = PaginationModel;
