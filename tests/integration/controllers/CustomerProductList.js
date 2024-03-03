/* eslint-disable new-cap */

'use strict';

const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const sinon = require('sinon');
const Logger = require('../../mock/dw/system/Logger');
const URLUtils = require('../../mock/dw/web/URLUtils');
const ISML = require('../../mock/dw/template/ISML');
const Resource = require('../../mock/dw/web/Resource');
const Response = require('../../mock/util/Response');
const DW = require('../../mock/dw');
const StringUtils = require('../../mock/dw/util/StringUtils');
const OCAPI = require('../../mock/util/OCAPI');
const paginationModel = require('../../mock/models/paginationModel');

const {
    jobExecutionSearchResponseMock,
    searchJobResponseMock,
    AppUtil,
    RenderTemplateHelper,
    CustomerMgrMock,
    ProductListMgrMock
} = require('../../mock/controllers');

let RequestBuilderStub = sinon.stub();
let BatchBuilderStub = sinon.stub();
var ismlRender;
var resRenderJsonSpy;
var getRenderHtmlSpy;

const productListHelperMock = {
    getSelectedProductList: sinon.stub()
};

var constants = {
    CUSTOMER_PRODUCTLIST: Object.freeze({
        LIST_TYPES: []
    })
};

describe('CustomerProductList', function () {
    var responseUtil = require('../../../cartridges/bm_itg_extension/cartridge/scripts/util/responseUtil');

    var { Start: start,
        GetList: getList
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/CustomerProductList', {
        'dw/web/URLUtils': URLUtils,
        'dw/util/StringUtils': StringUtils,
        'dw/customer/CustomerMgr': CustomerMgrMock,
        'dw/customer/ProductListMgr': ProductListMgrMock,
        'dw/web/Resource': Resource,
        'dw/template/ISML': ISML,
        '*/cartridge/scripts/helpers/productListHelper': productListHelperMock,
        '*/cartridge/scripts/renderTemplateHelper': RenderTemplateHelper,
        '*/cartridge/scripts/helpers/constants': constants,
        '*/cartridge/scripts/util/responseUtil': responseUtil,
        'dw/system/Logger': Logger,
        '*/cartridge/scripts/util/app': AppUtil,
        '*/cartridge/models/paginationModel': paginationModel,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        }

    });

    before(() => {
        sinon.replace(OCAPI.RequestBuilder.prototype, 'execute', RequestBuilderStub);
        sinon.replace(OCAPI.BatchBuilder.prototype, 'execute', BatchBuilderStub);
    });

    after(() => {
        sinon.restore();
    });

    beforeEach(function () {
        global.empty = function (value) { return value == null || value === ''; };
        global.response = Response;
        global.dw = DW;
        resRenderJsonSpy = sinon.spy(responseUtil, 'renderJSON');
        getRenderHtmlSpy = sinon.spy(RenderTemplateHelper, 'getRenderedHtml');
        ismlRender = sinon.spy(ISML, 'renderTemplate');
    });

    afterEach(function () {
        // Cleanup after each test
        resRenderJsonSpy.restore();
        getRenderHtmlSpy.restore();
        ismlRender.restore();
    });

    describe('#start', function () {
        it('start function should render the template with the correct parameters', function () {
            // Mock data
            var mockedActionUrl = URLUtils.https('CustomerProductList-GetList');
            RequestBuilderStub.returns(searchJobResponseMock);
            BatchBuilderStub.returns(jobExecutionSearchResponseMock);

            start();

            assert.include(mockedActionUrl, 'CustomerProductList-GetList', 'URLUtils.url should include "CustomerProductList-GetList"');
            assert.include(Resource.msg('test'), 'test', 'Resource.msg should include "test"');
            assert.isTrue(ismlRender.calledOnce);
            assert.isTrue(ismlRender.calledWith('customerProductList/customerProductList', {
                actionUrl: sinon.match.string,
                productListTypes: sinon.match.array,
                breadcrumbs: sinon.match.array
            }));
        });

        it('start function should render errorPage template when error is thrown', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            ISML.renderTemplate = sinon.stub().callsFake(function (templateName) {
                if (templateName === 'customerProductList/customerProductList') {
                    throw new Error('Error rendering customerProductList/customerProductList template: ERROR MESSAGE');
                }
            });
            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
        });
    });

    describe('#getList', function () {
        it('should retrieve product lists for a customer with valid email search term and list ID', () => {
            AppUtil.getRequestFormOrParams.returns({ searchTerm: 'test@example.com', listId: 'list1', productListType: '1', pageSize: '10', pageNumber: '1' });
            CustomerMgrMock.getCustomerByLogin.returns({});
            ProductListMgrMock.getProductLists.returns([{ listId: '1' }, { listId: '2' }]);
            getList();

            var resultContext = {
                productLists: [{ listId: '1' }, { listId: '2' }],
                paginationModel: new paginationModel(),
                searchTerm: 'test@example.com',
                selectedListId: 'list1'
            };

            var resultTemplate = 'customerProductList/productList';
            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: true,
                renderedTemplate: sinon.match.any
            }));
        });

        it('should retrieve product lists for a customer with valid number search term and list ID', () => {
            AppUtil.getRequestFormOrParams.returns({ searchTerm: '123', listId: 'list1', productListType: '1', pageSize: '10', pageNumber: '1' });
            CustomerMgrMock.getCustomerByCustomerNumber.returns({});
            ProductListMgrMock.getProductLists.returns([{ listId: '1' }, { listId: '2' }]);
            getList();

            var resultContext = {
                productLists: [{ listId: '1' }, { listId: '2' }],
                paginationModel: new paginationModel(),
                searchTerm: '123',
                selectedListId: 'list1'
            };

            var resultTemplate = 'customerProductList/productList';
            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: true,
                renderedTemplate: sinon.match.any
            }));
        });

        it('should retrieve product lists for a customer with no associated product lists', () => {
            AppUtil.getRequestFormOrParams.returns({ searchTerm: 'test@example.com', listId: 'list1', productListType: '1', pageSize: '10', pageNumber: '1' });
            CustomerMgrMock.getCustomerByLogin.returns({});
            ProductListMgrMock.getProductLists.returns([]);
            getList();

            var resultContext = {
                message: Resource.msg('no.productlist.associated.with.this.customer.number', 'customer_productlist', null),
                paginationModel: []
            };

            var resultTemplate = 'customerProductList/productList';
            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: true,
                renderedTemplate: sinon.match.any
            }));
        });

        it('should retrieve product lists for non-existent customer', () => {
            AppUtil.getRequestFormOrParams.returns({ searchTerm: 'test@example.com', listId: 'list1', productListType: '1', pageSize: '10', pageNumber: '1' });
            CustomerMgrMock.getCustomerByLogin.returns(null);
            ProductListMgrMock.getProductLists.returns([]);
            getList();

            var resultContext = {
                message: Resource.msg('no.customer.associated.for.this.number', 'customer_productlist', null),
                paginationModel: []
            };

            var resultTemplate = 'customerProductList/productList';
            assert.isTrue(getRenderHtmlSpy.calledOnce);
            assert.isTrue(getRenderHtmlSpy.calledWith(resultContext, resultTemplate));
            assert.isTrue(resRenderJsonSpy.calledOnce);
            assert.isTrue(resRenderJsonSpy.calledWith({
                success: true,
                renderedTemplate: sinon.match.any
            }));
        });
    });
});
