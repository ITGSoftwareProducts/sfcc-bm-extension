/* eslint-disable new-cap */

'use strict';

const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const sinon = require('sinon');
const Site = require('../../mock/dw/system/Site');
const URLUtils = require('../../mock/dw/web/URLUtils');
const StringUtils = require('../../mock/dw/util/StringUtils');
const Resource = require('../../mock/dw/web/Resource');
const Logger = require('../../mock/dw/system/Logger');
const ISML = require('../../mock/dw/template/ISML');
const { AppUtil } = require('../../mock/controllers');

var urlUtilsUrl;
var currentSite;

describe('AutomaticNotificationSettings', function () {
    const CustomObjectMgr = sinon.stub();
    const PromotionMgr = sinon.stub();
    const ProductMgr = sinon.stub();
    const Calendar = sinon.stub();
    const Transaction = { wrap: sinon.stub() };
    const response = { renderJSON: sinon.stub() };
    const responseObj = { success: true };
    const automaticNotificationHelper = {
        getOOSNotificationSettings: sinon.stub(),
        getOrderIntervalAlertSettings: sinon.stub(),
        getFailedOrderAlertSettings: sinon.stub(),
        getCampaignNotificationSettings: sinon.stub(),
        handleSaveOOSNotificationSettings: sinon.stub(),
        handleSaveOrderIntervalSettings: sinon.stub(),
        handleSaveCampaignNotificationSettings: sinon.stub(),
        getCampaignSuggestions: sinon.stub(),
        handleSaveFailedOrderAlertSettings: sinon.stub(),
        saveSenderEmail: sinon.stub(),
        validateProducts: sinon.stub(),
        validateCampaigns: sinon.stub()
    };
    const constants = {};
    const originalRequest = global.request;
    var { ShowOOSNotificationSettings: showOOSNotificationSettings,
        ShowOrderAlertSettings: showOrderAlertSettings,
        ShowCampaignNotificationSetting: showCampaignNotificationSetting,
        SaveOOSNotificationSettings: saveOOSNotificationSettings,
        SaveOrderIntervalSettings: saveOrderIntervalSettings,
        SaveCampaignNotificationSettings: saveCampaignNotificationSettings,
        SaveFailedOrderAlertSettings: saveFailedOrderAlertSettings,
        SaveSenderEmail: saveSenderEmail,
        GetCampaignSuggestions: getCampaignSuggestions,
        UpdateEnablementPreference: updateEnablementPreference
    } = proxyquire('../../../cartridges/bm_itg_extension/cartridge/controllers/AutomaticNotificationSettings', {
        'dw/template/ISML': ISML,
        'dw/web/URLUtils': URLUtils,
        'dw/web/Resource': Resource,
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        'dw/system/Transaction': Transaction,
        'dw/campaign/PromotionMgr': PromotionMgr,
        'dw/catalog/ProductMgr': ProductMgr,
        'dw/util/Calendar': Calendar,
        'dw/system/Site': Site,
        '~/cartridge/scripts/util/responseUtil': response,
        '*/cartridge/scripts/helpers/automaticNotificationHelper': automaticNotificationHelper,
        '~/cartridge/scripts/helpers/constants': constants,
        'dw/system/Logger': Logger,
        '*/cartridge/scripts/util/app': AppUtil,
        'dw/util/StringUtils': StringUtils,
        '~/cartridge/scripts/util/guard': {
            ensure: (filters, action) => sinon.stub().callsFake(action)
        }
    });

    beforeEach(function () {
        urlUtilsUrl = sinon.spy(URLUtils, 'https');
        currentSite = sinon.spy(Site, 'getCurrent');
        global.empty = function (value) { return value == null || value === ''; };
        sinon.stub(ISML, 'renderTemplate');
        sinon.stub(Resource, 'msg');
    });

    afterEach(function () {
        sinon.restore();
        response.renderJSON.reset();
        urlUtilsUrl.restore();
        global.request = originalRequest;
    });

    describe('#ShowOOSNotificationSettings', function () {
        it('should render the OOS notifications page with correct breadcrumbs and template', function () {
            automaticNotificationHelper.getOOSNotificationSettings.returns({});

            showOOSNotificationSettings();

            assert.isTrue(ISML.renderTemplate.calledWith('automaticNotificationSettings/notificationMainPage', {
                outOfStockNotification: sinon.match.object,
                EnablementURL: sinon.match.string,
                breadcrumbs: sinon.match.array,
                saveSenderEmailUrl: sinon.match.string,
                validationResult: sinon.match.object,
                template: 'automaticNotificationSettings/outOfStockNotification'
            }));
        });

        it('should render the OOS notifications page with valid list of products', function () {
            automaticNotificationHelper.getOOSNotificationSettings.returns({ productArray: ['1234'] });

            automaticNotificationHelper.validateProducts.returns({ valid: true });

            showOOSNotificationSettings();

            assert.isTrue(ISML.renderTemplate.calledWith('automaticNotificationSettings/notificationMainPage', {
                outOfStockNotification: sinon.match.object,
                EnablementURL: sinon.match.string,
                breadcrumbs: sinon.match.array,
                saveSenderEmailUrl: sinon.match.string,
                validationResult: sinon.match.object,
                template: 'automaticNotificationSettings/outOfStockNotification'
            }));
        });

        it('should handle errors and render the error template', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            const errorMessage = 'An error occurred!';
            const error = new Error(errorMessage);
            automaticNotificationHelper.getOOSNotificationSettings.throws(error);

            showOOSNotificationSettings();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
            sinon.assert.calledOnce(ISML.renderTemplate);
        });
    });
    describe('#ShowOrderAlertSettings', function () {
        it('should render order alerts page with correct breadcrumbs and template', function () {
            automaticNotificationHelper.getOrderIntervalAlertSettings.returns('mockedOrderIntervalAlert');
            automaticNotificationHelper.getFailedOrderAlertSettings.returns('mockedFailedOrderAlert');

            showOrderAlertSettings();

            assert.isTrue(ISML.renderTemplate.calledOnce);
            assert.isTrue(ISML.renderTemplate.calledWith('automaticNotificationSettings/notificationMainPage', {
                orderIntervalAlert: sinon.match.string,
                failedOrderAlert: sinon.match.string,
                EnablementURL: sinon.match.string,
                saveSenderEmailUrl: sinon.match.string,
                breadcrumbs: sinon.match.array,
                template: 'automaticNotificationSettings/orderAlerts'
            }));
        });

        it('should handle errors and render the error template for OrderAlertSettings', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            const errorMessage = 'An error occurred!';
            const error = new Error(errorMessage);
            automaticNotificationHelper.getOrderIntervalAlertSettings.throws(error);

            showOrderAlertSettings();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
            sinon.assert.calledOnce(ISML.renderTemplate);
        });
    });
    describe('#ShowCampaignNotificationSetting', function () {
        it('should render the campaign notifications page with correct breadcrumbs and URLs', function () {
            automaticNotificationHelper.getCampaignNotificationSettings.returns({});

            showCampaignNotificationSetting();

            assert.isTrue(ISML.renderTemplate.calledOnce);
            assert.isTrue(ISML.renderTemplate.calledWith('automaticNotificationSettings/notificationMainPage', {
                campaignManagementNotification: sinon.match.object,
                campaignSuggestionsURL: sinon.match.string,
                EnablementURL: sinon.match.string,
                saveSenderEmailUrl: sinon.match.string,
                breadcrumbs: sinon.match.array,
                validationResult: sinon.match.object,
                template: 'automaticNotificationSettings/campaignNotification'
            }));
        });

        it('should render the campaign notifications page with valid campain list', function () {
            automaticNotificationHelper.getCampaignNotificationSettings.returns({ campaigns: ['123'] });
            automaticNotificationHelper.validateCampaigns.returns({ valid: true });

            showCampaignNotificationSetting();

            assert.isTrue(ISML.renderTemplate.calledOnce);
            assert.isTrue(ISML.renderTemplate.calledWith('automaticNotificationSettings/notificationMainPage', {
                campaignManagementNotification: sinon.match.object,
                campaignSuggestionsURL: sinon.match.string,
                EnablementURL: sinon.match.string,
                saveSenderEmailUrl: sinon.match.string,
                breadcrumbs: sinon.match.array,
                validationResult: sinon.match.object,
                template: 'automaticNotificationSettings/campaignNotification'
            }));
        });

        it('should handle errors and render the error template for ShowCampaignNotificationSetting', function () {
            const request = {
                httpQueryString: ''
            };
            global.request = request;
            const errorMessage = 'An error occurred!';
            const error = new Error(errorMessage);
            automaticNotificationHelper.getCampaignNotificationSettings.throws(error);

            showCampaignNotificationSetting();

            assert.isTrue(ISML.renderTemplate.calledWith('common/errorPage', {
                breadcrumbs: sinon.match.array,
                message: sinon.match.string,
                currentUrl: sinon.match.string
            }));
            sinon.assert.calledOnce(ISML.renderTemplate);
        });
    });
    describe('#SaveOOSNotificationSettings', function () {
        it('should successfully save OOS notification settings', function () {
            const requestData = {
                senderEmail: 'no-reply@salesforce.com',
                recipientEmails: ['no-reply@salesforce.com'],
                products: ['008884303989', '008884303980', '008884303987']
            };

            const request = {
                httpParameterMap: {
                    data: JSON.stringify(requestData)
                }
            };

            global.request = request;
            global.responseUtil = response.renderJSON;
            automaticNotificationHelper.handleSaveOOSNotificationSettings.returns(responseObj);

            saveOOSNotificationSettings();

            assert.isTrue(automaticNotificationHelper.handleSaveOOSNotificationSettings.calledWithExactly(requestData));
            assert.isTrue(response.renderJSON.calledWithExactly(responseObj));
        });

        it('should return a JSON response object with success false and an error message when an error occurs', function () {
            const request = {
                httpParameterMap: {
                    data: JSON.stringify({})
                }
            };
            global.request = request;
            automaticNotificationHelper.handleSaveOOSNotificationSettings.throws(new Error('Invalid input data'));

            saveOOSNotificationSettings();

            assert.isTrue(automaticNotificationHelper.handleSaveOOSNotificationSettings.calledWithExactly({}));
        });
    });
    describe('#SaveOrderIntervalSettings', function () {
        it('should successfully save order interval alert settings', function () {
            const requestData = {
                senderEmail: 'no-reply@salesforce.com',
                recipientEmails: ['no-reply@salesforce.com'],
                interval: { 'days': '2', 'hours': '1', 'minutes': '1' }
            };
            const request = {
                httpParameterMap: {
                    data: JSON.stringify(requestData)
                }
            };
            global.request = request;
            automaticNotificationHelper.handleSaveOrderIntervalSettings.returns({});
            var result = responseObj;
            result.orderIntervalValue = {};

            saveOrderIntervalSettings();


            assert.isTrue(response.renderJSON.calledOnce);
            assert.isTrue(automaticNotificationHelper.handleSaveOrderIntervalSettings.calledWithExactly(requestData));
            assert.isTrue(response.renderJSON.calledWithExactly(responseObj));
        });

        it('should handle invalid input data gracefully', function () {
            const request = {
                httpParameterMap: {
                    data: JSON.stringify({})
                }
            };
            global.request = request;
            automaticNotificationHelper.handleSaveOrderIntervalSettings.throws(new Error('Invalid input data'));

            saveOrderIntervalSettings();

            assert.isTrue(automaticNotificationHelper.handleSaveOrderIntervalSettings.calledWithExactly({}));
        });
    });
    describe('#SaveCampaignNotificationSettings', function () {
        it('should successfully save content management notification settings', function () {
            const requestData = {
                senderEmail: 'no-reply@salesforce.com',
                recipientEmails: ['no-reply@salesforce.com'],
                campaignRecords: [{ 'campaignId': '5_off_ties_campaign', 'days': '4', 'hours': '4', 'minutes': '30' }]
            };
            const request = {
                httpParameterMap: {
                    data: JSON.stringify(requestData)
                }
            };
            global.request = request;

            saveCampaignNotificationSettings();
        });

        it('should return error response for invalid JSON data in request parameters', function () {
            const request = {
                httpParameterMap: {
                    data: JSON.stringify({})
                }
            };

            global.request = request;
            automaticNotificationHelper.handleSaveCampaignNotificationSettings.throws(new Error('Invalid input data'));

            saveCampaignNotificationSettings();

            assert.isTrue(automaticNotificationHelper.handleSaveCampaignNotificationSettings.calledWithExactly({}));
        });
    });
    describe('#SaveFailedOrderAlertSettings', function () {
        it('should successfully save failed order alert settings', function () {
            const requestData = {
                senderEmail: 'no-reply@salesforce.com',
                recipientEmails: ['no-reply@salesforce.com'],
                interval: { 'days': '1', 'hours': '1', 'minutes': '1' },
                countThreshold: '33'
            };
            const request = {
                httpParameterMap: {
                    data: JSON.stringify(requestData)
                }
            };
            global.request = request;

            saveFailedOrderAlertSettings();

            sinon.assert.calledOnce(automaticNotificationHelper.handleSaveFailedOrderAlertSettings);
        });

        it('save failed order alert settings throwing an error', function () {
            const request = {
                httpParameterMap: {
                    data: JSON.stringify({})
                }
            };

            global.request = request;
            automaticNotificationHelper.handleSaveFailedOrderAlertSettings.throws(new Error('Invalid input data'));
            saveFailedOrderAlertSettings();

            assert.isTrue(automaticNotificationHelper.handleSaveFailedOrderAlertSettings.calledWithExactly({}));
        });
    });

    describe('#GetCampaignSuggestions', function () {
        it('should retrieve campaign suggestions when search phrase is provided', function () {
            const request = {
                httpParameterMap: {
                    searchPhrase: {
                        value: 'test'
                    }
                }
            };
            const suggestionsResult = {
                campaignDetails: ['campaign1', 'campaign2'],
                errorMessage: ''
            };
            global.request = request;
            automaticNotificationHelper.getCampaignSuggestions.returns(suggestionsResult);

            getCampaignSuggestions();

            assert.isTrue(automaticNotificationHelper.getCampaignSuggestions.calledWithExactly('test'));
            assert.ok(empty(suggestionsResult.errorMessage));
            assert.strictEqual(suggestionsResult.errorMessage, '', 'errorMessage should be empty');
        });

        it('return error response when campaign suggestions has error message', function () {
            const request = {
                httpParameterMap: {
                    searchPhrase: {
                        value: 'test'
                    }
                }
            };
            global.request = request;
            const suggestionsErrorResult = {
                campaignDetails: ['campaign1', 'campaign2'],
                errorMessage: 'An error occurred!'
            };
            automaticNotificationHelper.getCampaignSuggestions.returns(suggestionsErrorResult);

            getCampaignSuggestions();

            assert.isTrue(automaticNotificationHelper.getCampaignSuggestions.calledWithExactly('test'));
            assert.notOk(empty(suggestionsErrorResult.errorMessage));
        });

        it('should return error response when campaign suggestions retrieval fails', function () {
            const request = {
                httpParameterMap: {
                    searchPhrase: {
                        value: ''
                    }
                }
            };
            global.request = request;
            automaticNotificationHelper.getCampaignSuggestions.throws(new Error('An error occurred!'));

            getCampaignSuggestions();

            assert.isFalse(automaticNotificationHelper.getCampaignSuggestions.calledWithExactly({}));
        });
    });

    describe('#UpdateEnablementPreference', function () {
        it('should successfully update enablement preference', function () {
            const request = {
                httpParameterMap: {
                    data: JSON.stringify({
                        prefId: 'preferenceId',
                        enabled: 'true'
                    })
                }
            };
            global.request = request;
            global.currentSite = currentSite;
            Transaction.wrap.callsArgWith(0, currentSite);

            updateEnablementPreference();

            assert.isTrue(Transaction.wrap.calledOnce);
            Transaction.wrap.reset();
        });

        it('should successfully update enablement preference with empty params', function () {
            const request = {
                httpParameterMap: {
                    data: JSON.stringify({})
                }
            };
            global.request = request;
            global.currentSite = currentSite;
            Transaction.wrap.callsArgWith(0, currentSite);

            updateEnablementPreference();

            assert.isTrue(Transaction.wrap.calledOnce);
            Transaction.wrap.reset();
        });
    });
    describe('#SaveSenderEmail', function () {
        it('should retrieve sender email and custom object IDs from request parameters', function () {
            automaticNotificationHelper.saveSenderEmail.returns();
            const senderEmail = 'test@example.com';
            const customObjectIds = [1, 2, 3];
            AppUtil.getRequestFormOrParams.returns({
                senderEmail: 'test@example.com',
                customObjectIds: JSON.stringify([1, 2, 3])
            });

            saveSenderEmail();

            assert.isTrue(AppUtil.getRequestFormOrParams.calledOnce, 'getRequestFormOrParams should be called once');
            assert.isTrue(automaticNotificationHelper.saveSenderEmail.calledOnceWith(senderEmail, customObjectIds), 'saveSenderEmail should be called once with correct parameters');

            AppUtil.getRequestFormOrParams.reset();
            automaticNotificationHelper.saveSenderEmail.reset();
        });
    });
});
