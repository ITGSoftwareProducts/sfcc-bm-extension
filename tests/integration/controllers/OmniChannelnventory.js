
'use strict';

const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const sinon = require('sinon');
const ISML = require('../../mock/dw/template/ISML');
const URLUtils = require('../../mock/dw/web/URLUtils');
const Resource = require('../../mock/dw/web/Resource');
const StringUtils = require('../../mock/dw/util/StringUtils');
const ArrayList = require('../../mock/dw/util/ArrayList');
const PaginationModel = require('../../mock/models/paginationModel');
const Logger = require('../../mock/dw/system/Logger');
const { AppUtil, RenderTemplateHelper } = require('../../mock/controllers');
var urlUtilsUrl;

describe('OmniChannelnventory', function () {
    const response = { renderJSON: sinon.stub() };
    const ProductMgr = { getProduct: sinon.stub() };
    const ociInventoryHelper = {
        getGroupsAndLocations: sinon.stub(),
        updateOrAddInventoryRecord: sinon.stub(),
        searchInventory: sinon.stub()
    };
    const configurationHelper = { isOciInventoryIntegrationMode: sinon.stub() };
    var { Start: start,
        UpdateOrAddInventoryRecord: updateOrAddInventoryRecord,
        SearchInventoryRecords: searchInventoryRecords,
        GetRecordDetails: getRecordDetails
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/OmniChannelnventory.js', {
        'dw/template/ISML': ISML,
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        '*/cartridge/scripts/renderTemplateHelper': RenderTemplateHelper,
        '~/cartridge/scripts/helpers/ociInventoryHelper': ociInventoryHelper,
        'dw/catalog/ProductMgr': ProductMgr,
        '*/cartridge/scripts/util/app': AppUtil,
        '*/cartridge/scripts/util/responseUtil': response,
        '*/cartridge/models/paginationModel': PaginationModel,
        'dw/util/ArrayList': ArrayList,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Logger': Logger,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        },
        '*/cartridge/scripts/helpers/configurationHelper': configurationHelper,
        '~/cartridge/scripts/helpers/constants': {
            OMNI_CHANNEL_INVENTORY: {
                MAX_SEARCH_ITEAMS: 10
            }
        }
    });

    beforeEach(function () {
        global.empty = function (value) {
            return value == null || value === '' || (Array.isArray(value) && value.length === 0);
        };
        urlUtilsUrl = sinon.spy(URLUtils, 'https');
        sinon.stub(ISML, 'renderTemplate');
        sinon.stub(Resource, 'msg');
        configurationHelper.isOciInventoryIntegrationMode.returns(true);
        sinon.stub(RenderTemplateHelper, 'getRenderedHtml').returns('rendered html');
    });

    afterEach(function () {
        sinon.restore();
        response.renderJSON.reset();
        urlUtilsUrl.restore();
    });
    describe('#Start', function () {
        it('should render error page when is not OciIntegrationMode', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            configurationHelper.isOciInventoryIntegrationMode.returns(false);

            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: undefined,
                currentUrl: sinon.match.string
            }));
            sinon.assert.calledOnce(ISML.renderTemplate);

            configurationHelper.isOciInventoryIntegrationMode.reset();
        });

        it('should render the OCI Inventory landing page with appropriate data and URLs', function () {
            ociInventoryHelper.getGroupsAndLocations.returns({ groupsAndLocations: [
                {
                    'name': 'Group 1',
                    'locations': ['Location 1', 'Location 2']
                }
            ] });

            start();

            assert.isTrue(ISML.renderTemplate.calledWith('oci/ociInventoryLandingPage', {
                updateRecordActionUrl: sinon.match.string,
                searchInventoryActionUrl: sinon.match.string,
                groupsAndLocations: sinon.match.array,
                breadcrumbs: sinon.match.array
            }));

            sinon.assert.calledOnce(ISML.renderTemplate);
            ociInventoryHelper.getGroupsAndLocations.reset();
        });

        it('should render error page when GroupsAndLocations is empty', function () {
            global.request = {
                httpQueryString: ''
            };
            ociInventoryHelper.getGroupsAndLocations.returns({});

            start();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: undefined,
                currentUrl: sinon.match.string
            }));
            sinon.assert.calledOnce(ISML.renderTemplate);

            ociInventoryHelper.getGroupsAndLocations.reset();
        });

        it('should throw an error and render an error page if an exception is caught', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            ociInventoryHelper.getGroupsAndLocations.returns({ groupsAndLocations: [
                {
                    'name': 'Group 1',
                    'locations': ['Location 1', 'Location 2']
                }
            ] });
            ISML.renderTemplate.throws(new Error('error'));


            assert.throws(() => {
                start();
            }, /error/, 'Should throw an exception');
            assert.isTrue(ISML.renderTemplate.called, 'ISML.renderTemplate should be called once');
            assert.isTrue(ISML.renderTemplate.calledWithExactly('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
            ociInventoryHelper.getGroupsAndLocations.reset();
        });
    });

    describe('#UpdateOrAddInventoryRecord', function () {
        it('should update inventory record when given a valid product ID', function () {
            AppUtil.getRequestFormOrParams.returns({ productId: 'validProductId' });
            ProductMgr.getProduct.returns({});
            ociInventoryHelper.updateOrAddInventoryRecord.returns({});

            updateOrAddInventoryRecord();
            assert.isTrue(response.renderJSON.calledOnce);
            assert.strictEqual(response.renderJSON.calledWith({ success: true }), true);

            AppUtil.getRequestFormOrParams.reset();
            ociInventoryHelper.updateOrAddInventoryRecord.reset();
        });

        it('should retrun error when given an empty product', function () {
            AppUtil.getRequestFormOrParams.returns({ productId: '' });
            const responseObj = {
                success: false,
                productErrorMessage: Resource.msgf('invalid.new.product.id', 'oci', null)
            };
            ProductMgr.getProduct.returns(null);
            ociInventoryHelper.updateOrAddInventoryRecord.returns({});

            updateOrAddInventoryRecord();

            assert.isTrue(response.renderJSON.calledWith(responseObj));

            ociInventoryHelper.updateOrAddInventoryRecord.reset();
        });

        it('should update inventory record when given a valid product ID', function () {
            AppUtil.getRequestFormOrParams.returns({ productId: 'validProductId' });
            const ociResponse = {
                error: true,
                errors: {
                    message: 'An error occurred!'
                },
                message: 'error'
            };
            ProductMgr.getProduct.returns({});
            ociInventoryHelper.updateOrAddInventoryRecord.returns(ociResponse);

            updateOrAddInventoryRecord();
            assert.isTrue(response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.array
            }));

            AppUtil.getRequestFormOrParams.reset();
            ociInventoryHelper.updateOrAddInventoryRecord.reset();
        });
    });

    describe('#SearchInventoryRecords', function () {
        it('should return inventory records for a single product ID', function () {
            const productIds = [...Array(2).keys()].map(index => `id${index + 1}`);
            ociInventoryHelper.searchInventory.returns({
                records: productIds.map(productId => ({
                    productID: productId,
                    quantity: 10,
                    location: 'Location'
                }))
            });
            ociInventoryHelper.getGroupsAndLocations.returns({
                groupsAndLocations: {
                    groups: ['Group 1', 'Group 2'],
                    locations: ['Location 1', 'Location 2']
                }
            });
            AppUtil.getRequestFormOrParams.returns({
                searchTerm: '12345',
                pageSize: '10',
                pageNumber: '1'
            });
            ProductMgr.getProduct.returns({
                ID: '12345',
                name: 'Product Name',
                availabilityModel: {
                    inventoryRecord: {
                        ATS: 10,
                        inStockDate: new Date(),
                        online: true
                    }
                }
            });

            searchInventoryRecords();

            assert.isTrue(AppUtil.getRequestFormOrParams.called);
            assert.isTrue(RenderTemplateHelper.getRenderedHtml.calledWith(sinon.match.object, 'oci/ociInventoryResults'));
            assert.isTrue(response.renderJSON.calledWith({
                success: true,
                renderedTemplate: sinon.match.string
            }));
            ociInventoryHelper.searchInventory.reset();
            ociInventoryHelper.getGroupsAndLocations.reset();
            AppUtil.getRequestFormOrParams.reset();
        });

        it('should return error when given empty product', function () {
            AppUtil.getRequestFormOrParams.returns({
                searchTerm: '12345',
                pageSize: '10',
                pageNumber: '1'
            });
            ProductMgr.getProduct.returns(null);

            searchInventoryRecords();

            assert.isTrue(AppUtil.getRequestFormOrParams.called);
            assert.isTrue(response.renderJSON.calledWith({
                success: false,
                errorMessage: sinon.match.string,
                renderedTemplate: sinon.match.string
            }));
            ociInventoryHelper.searchInventory.reset();
            ociInventoryHelper.getGroupsAndLocations.reset();
            AppUtil.getRequestFormOrParams.reset();
        });

        it('should return error when prodcuts id length more than or equal 200', function () {
            const productIds = [...Array(200).keys()].map(index => `id${index + 1}`);
            ProductMgr.getProduct.returns({
                ID: 'productId',
                name: 'Product Name',
                availabilityModel: {
                    inventoryRecord: {
                        ATS: 10,
                        inStockDate: new Date(),
                        online: true
                    }
                }
            });
            ociInventoryHelper.searchInventory.returns({
                records: productIds.map(productId => ({
                    productID: productId,
                    quantity: 10,
                    location: 'Location'
                }))
            });
            ociInventoryHelper.getGroupsAndLocations.returns({
                groups: ['Group 1', 'Group 2'],
                locations: ['Location 1', 'Location 2']
            });
            AppUtil.getRequestFormOrParams.returns({
                searchTerm: productIds.join(','),
                pageSize: '10',
                pageNumber: '1'
            });

            searchInventoryRecords();

            assert.isFalse(ociInventoryHelper.searchInventory.calledOnce);
            assert.isTrue(AppUtil.getRequestFormOrParams.called);
            assert.isTrue(response.renderJSON.calledWith({
                success: false,
                errorMessage: 'product.search.limit',
                renderedTemplate: sinon.match.string
            }));
            ociInventoryHelper.searchInventory.reset();
            ociInventoryHelper.getGroupsAndLocations.reset();
            AppUtil.getRequestFormOrParams.reset();
        });

        it('should handle the else case when records are empty', function () {
            ociInventoryHelper.searchInventory.returns({ records: null });
            AppUtil.getRequestFormOrParams.returns({
                searchTerm: '12345',
                pageSize: '10',
                pageNumber: '1'
            });

            searchInventoryRecords();

            assert.isTrue(ociInventoryHelper.searchInventory.calledOnce);
            assert.isTrue(AppUtil.getRequestFormOrParams.called);
            assert.isTrue(response.renderJSON.calledWith({
                success: false
            }));
            ociInventoryHelper.searchInventory.reset();
            AppUtil.getRequestFormOrParams.reset();
        });
    });

    describe('#GetRecordDetails', function () {
        it('should retrieve inventory record successfully with valid productId and inventoryId', function () {
            AppUtil.getRequestFormOrParams.returns({ productId: '123', inventoryId: '456' });
            ociInventoryHelper.searchInventory.returns({ records: [{ id: '789' }], isGroup: true, inventoryId: '456' });
            const resultTemplate = 'oci/ociProductDetails';
            RenderTemplateHelper.getRenderedHtml.returns(resultTemplate);

            getRecordDetails();

            sinon.assert.calledWith(response.renderJSON, {
                success: true,
                isGroup: true,
                inventoryId: '456',
                renderedTemplate: resultTemplate
            });
        });

        it('should handle the else case when records are empty', function () {
            ociInventoryHelper.searchInventory.returns({ records: null, errorMessage: 'An error occurred!' });
            const responseObj = {
                success: false,
                serverErrors: ['An error occurred!']
            };

            getRecordDetails();

            assert.isTrue(response.renderJSON.calledWith(responseObj));
        });
    });
});

