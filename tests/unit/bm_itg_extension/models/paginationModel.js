'use strict';

const { assert } = require('chai');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const URLUtils = require('../../../mock/dw/web/URLUtils');
const PagingModel = require('../../../mock/dw/web/PagingModel');

describe('PaginationModel', () => {
    global.empty = function (value) { return value == null || value === ''; };
    const urlHelper = proxyquire('../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/urlHelper', {
        'dw/web/URLUtils': URLUtils
    });
    const PaginationModel = proxyquire('../../../../cartridges/bm_itg_extension/cartridge/models/paginationModel', {
        'dw/web/PagingModel': PagingModel,
        '*/cartridge/scripts/helpers/urlHelper': urlHelper
    });
    const skipCount = 6;
    it('should create a pagination model for OCAPI type', () => {
        const paginationParams = {
            type: 'ocapi',
            ocapiObj: {
                start: 10,
                total: 100,
                hits: [1, 2, 3]
            },
            urlParams: {
                pageSize: 20
            },
            urlPath: '/some/api/endpoint'
        };

        const paginationModel = new PaginationModel(paginationParams);
        assert.strictEqual(paginationModel.start, 10);
        assert.strictEqual(paginationModel.totalCount, 100);
        assert.strictEqual(paginationModel.pageSize, 20);
        assert.strictEqual(paginationModel.pageCount, 5);
        assert.strictEqual(paginationModel.itemNumber, 3);
        assert.strictEqual(paginationModel.itemPerPage, 11);
        assert.strictEqual(paginationModel.displayedItem, 13);
        assert.strictEqual(paginationModel.skipCount, skipCount);
        assert.deepEqual(paginationModel.defaultPageSize, [10, 25, 50, 100, 150, 200]);
        assert.strictEqual(paginationModel.selectedPage, 20);
        assert.strictEqual(paginationModel.startPage, 1);
        assert.strictEqual(paginationModel.endPage, skipCount);
        assert.strictEqual(paginationModel.url, '/some/api/endpoint?pageSize=20');
        assert.strictEqual(paginationModel.pageSizeUrl, '/some/api/endpoint');
    });
    it('should create a pagination model with ocapi pagination parameters and empty ocapi object', () => {
        const paginationParams = {
            type: 'ocapi',
            ocapiObj: {},
            urlParams: {
                pageSize: 20
            },
            urlPath: '/some/api/endpoint'
        };

        const paginationModel = new PaginationModel(paginationParams);
        assert.strictEqual(paginationModel.start, undefined);
        assert.strictEqual(paginationModel.totalCount, undefined);
        assert.strictEqual(paginationModel.pageSize, 20);
        assert.ok(isNaN(paginationModel.pageCount));
        assert.strictEqual(paginationModel.itemNumber, 0);
        assert.ok(isNaN(paginationModel.itemPerPage));
        assert.ok(isNaN(paginationModel.displayedItem));
        assert.strictEqual(paginationModel.skipCount, skipCount);
        assert.deepEqual(paginationModel.defaultPageSize, [10, 25, 50, 100, 150, 200]);
        assert.strictEqual(paginationModel.selectedPage, 20);
        assert.strictEqual(paginationModel.startPage, 1);
        assert.strictEqual(paginationModel.endPage, skipCount);
        assert.strictEqual(paginationModel.url, '/some/api/endpoint?pageSize=20');
        assert.strictEqual(paginationModel.pageSizeUrl, '/some/api/endpoint');
    });
    it('should create a pagination model for script type', () => {
        const paginationParams = {
            type: 'script',
            start: 20,
            responseObj: {
                items: [1, 2, 3],
                count: 100
            },
            urlParams: {
                pageSize: 20
            },
            urlPath: '',
            pageNumber: 2
        };
        const paginationModel = new PaginationModel(paginationParams);
        assert.strictEqual(paginationModel.start, 20);
        assert.strictEqual(paginationModel.totalCount, 100);
        assert.strictEqual(paginationModel.pageSize, 20);
        assert.strictEqual(paginationModel.pageCount, 5);
        assert.strictEqual(paginationModel.currentPage, 2);
        assert.strictEqual(paginationModel.itemNumber, 0);
        assert.strictEqual(paginationModel.itemPerPage, 21);
        assert.strictEqual(paginationModel.displayedItem, 20);
        assert.strictEqual(paginationModel.skipCount, skipCount);
        assert.deepEqual(paginationModel.defaultPageSize, [10, 25, 50, 100, 150, 200]);
        assert.strictEqual(paginationModel.selectedPage, 20);
        assert.strictEqual(paginationModel.startPage, 1);
        assert.strictEqual(paginationModel.endPage, skipCount);
    });
    it('should create a pagination model with script pagination parameters and empty response object', () => {
        const paginationParams = {
            type: 'script',
            responseObj: {},
            urlParams: {
                pageSize: 20
            },
            pageNumber: 2,
            urlPath: ''
        };

        const paginationModel = new PaginationModel(paginationParams);
        assert.strictEqual(paginationModel.start, 20);
        assert.strictEqual(paginationModel.totalCount, 100);
        assert.strictEqual(paginationModel.pageSize, 20);
        assert.strictEqual(paginationModel.pageCount, 5);
        assert.strictEqual(paginationModel.currentPage, 2);
        assert.strictEqual(paginationModel.itemNumber, 0);
        assert.strictEqual(paginationModel.itemPerPage, 21);
        assert.strictEqual(paginationModel.displayedItem, 20);
        assert.strictEqual(paginationModel.skipCount, skipCount);
        assert.deepEqual(paginationModel.defaultPageSize, [10, 25, 50, 100, 150, 200]);
        assert.strictEqual(paginationModel.selectedPage, 20);
        assert.strictEqual(paginationModel.startPage, 1);
        assert.strictEqual(paginationModel.endPage, skipCount);
    });
    it('should create a pagination model with script pagination parameters and page number greater than page count', () => {
        const paginationParams = {
            type: 'script',
            responseObj: {
                items: [1, 2, 3],
                count: 100
            },
            urlParams: {
                pageSize: 20
            },
            urlPath: '',
            pageNumber: 6
        };
        const paginationModel = new PaginationModel(paginationParams);
        assert.strictEqual(paginationModel.start, 100);
        assert.strictEqual(paginationModel.totalCount, 100);
        assert.strictEqual(paginationModel.pageSize, 20);
        assert.strictEqual(paginationModel.pageCount, 5);
        assert.strictEqual(paginationModel.currentPage, 6);
        assert.strictEqual(paginationModel.itemNumber, 0);
        assert.strictEqual(paginationModel.itemPerPage, 101);
        assert.strictEqual(paginationModel.displayedItem, 100);
        assert.strictEqual(paginationModel.skipCount, skipCount);
        assert.deepEqual(paginationModel.defaultPageSize, [10, 25, 50, 100, 150, 200]);
        assert.strictEqual(paginationModel.selectedPage, 20);
        assert.strictEqual(paginationModel.startPage, 1);
        assert.strictEqual(paginationModel.endPage, skipCount);
    });
});
