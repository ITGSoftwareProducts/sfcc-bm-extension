const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const OCAPI = require('../../../../mock/util/OCAPI');
const { searchJobResponseMock } = require('../../../../mock/controllers');
const StringUtils = require('../../../../mock/dw/util/StringUtils');
const Resource = require('../../../../mock/dw/web/Resource');
const Site = require('../../../../mock/dw/system/Site');
const Logger = require('../../../../mock/dw/system/Logger');

describe('CouponReplicationHelper', function () {
    let RequestBuilderStub = sinon.stub();
    let BatchBuilderStub = sinon.stub();
    let jobServicesHelperStub = {
        executeJob: sinon.stub()
    };
    let constantsStub = {
        COUPON_REPLICATOR: {
            FIRST_JOB_ID: 'firstJobId',
            SECOND_JOB_ID: 'secondJobId',
            IMPEX_PATH: '/path/to/impex/'
        }
    };

    var mockSitesResponseList = {
        responseList: {
            siteID1: { data: { id: '1' } },
            siteID2: { data: { id: '2' } }
        }
    };


    let couponService = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/couponReplicatorHelper', {
        'dw/system/Site': Site,
        'dw/system/Logger': Logger,
        'dw/web/Resource': Resource,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/helpers/constants': constantsStub,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelperStub,
        '~/cartridge/scripts/util/ocapi': OCAPI
    });

    beforeEach(function () {
        RequestBuilderStub = sinon.stub();
        BatchBuilderStub = sinon.stub();

        sinon.replace(OCAPI.RequestBuilder.prototype, 'execute', RequestBuilderStub);
        sinon.replace(OCAPI.BatchBuilder.prototype, 'execute', BatchBuilderStub);
    });

    afterEach(function () {
        sinon.restore();
    });

    describe('#getCouponList', function () {
        it('should build and execute a coupon search request', function () {
            const expectedResult = searchJobResponseMock;
            RequestBuilderStub.returns(searchJobResponseMock);

            const result = couponService.getCouponList('searchTerm', 10, 1, 'coupon_id', 'asc');

            var RequestBuilderSpy = sinon.spy(OCAPI, 'RequestBuilder');
            assert.strictEqual(result, expectedResult);
            assert.isTrue(RequestBuilderSpy.prototype.execute.calledOnce);
        });
    });

    describe('#getCouponReplicationData', function () {
        var siteStub;
        this.beforeEach(function () {
            siteStub = sinon.stub(Site, 'getAllSites').returns({
                toArray: sinon.stub().returns(
                    [
                        { getID: sinon.stub().returns('siteID1'), getName: sinon.stub().returns('site1Name') },
                        { getID: sinon.stub().returns('siteID2'), getName: sinon.stub().returns('site2Name') }

                    ])
            });
        });
        this.afterEach(function () {
            siteStub.restore();
        });
        it('should return availableSites when ocapiBatchRequest succeeds', function () {
            const couponId = 'yourCouponId';
            BatchBuilderStub.returns(mockSitesResponseList);


            const result = couponService.getCouponReplicationData(couponId);

            // Assert the expected result
            assert.deepEqual(result, {
                availableSites: [
                    { siteId: 'siteID1', siteName: 'site1Name', disabled: true },
                    { siteId: 'siteID2', siteName: 'site2Name', disabled: true }
                ]
            });
        });
        it('should return result of ocapiBatchRequest when ocapiBatchRequest fails', function () {
            const couponId = 'yourCouponId';
            BatchBuilderStub.returns({ error: true, serviceError: true });

            const result = couponService.getCouponReplicationData(couponId);

            // Assert the expected result
            assert.deepEqual(result, { error: true, serviceError: true });
        });
    });

    describe('#runCouponReplicatorJob', function () {
        it('should execute the job and return jobExecution object', function () {
            const couponId = 'yourCouponId';
            const siteIds = ['siteId1', 'siteId2'];
            const caseInsensitive = 'true';
            const multipleCodesPerBasket = 'false';
            const couponType = 'yourCouponType';
            const couponDesc = 'Your description here!';
            const currentSite = { ID: 'siteID1' };
            const siteStub = sinon.stub(Site.getCurrent(), 'ID').returns('siteID1');

            let StringUtilsStub = sinon.stub();

            sinon.replace(StringUtils, 'format', StringUtilsStub).returns('/path/to/impex/currentSiteId/coupon_codes');

            const expectedJobParams = {
                ReplicatedCouponId: couponId,
                SiteID: currentSite.ID,
                CouponId: couponId,
                CaseInsensitive: caseInsensitive,
                CouponCodeType: couponType,
                Description: couponDesc,
                MultipleCodesPerBasket: multipleCodesPerBasket,
                SiteScope: JSON.stringify({ named_sites: [currentSite.ID] }),
                SitesScope: JSON.stringify({ named_sites: siteIds }),
                ExportFileName: '/path/to/impex/currentSiteId/coupon_codes'
            };


            jobServicesHelperStub.executeJob.returns({});

            const result = couponService.runCouponReplicatorJob(couponId, siteIds, caseInsensitive, multipleCodesPerBasket, couponType, couponDesc);
            assert.deepEqual(result, { jobIds: ['firstJobId', 'secondJobId'] });
            assert.isTrue(jobServicesHelperStub.executeJob.calledOnceWithExactly(constantsStub.COUPON_REPLICATOR.FIRST_JOB_ID, expectedJobParams));
            siteStub.restore();
        });
    });
    describe('#runCouponReplicatorJob2', function () {
        it('should execute the second job and return jobExecution object', function () {
            const siteIds = ['siteID1', 'siteID2'];
            const SiteID = 'currentSiteId';

            const expectedJobParams = {
                SiteScope: siteIds,
                WorkingFolder: '/path/to/impex/currentSiteId/'
            };
            jobServicesHelperStub.executeJob.returns({});

            const result = couponService.runCouponReplicatorJob2(siteIds, SiteID);
            assert.isTrue(jobServicesHelperStub.executeJob.calledWithExactly(constantsStub.COUPON_REPLICATOR.SECOND_JOB_ID, expectedJobParams));
            assert.deepEqual(result, {});
        });
    });
});
