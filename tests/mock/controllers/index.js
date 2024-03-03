var sinon = require('sinon');

var getResponseData = (reqId) => {
    return {
        id: reqId,
        job_id: 'job' + reqId,
        value_type: 'string',
        execution_status: 'completed',
        exit_status: { status: 'ok', message: 'exit msg' + reqId },
        step_executions: [{
            message: 'test',
            job_id: 'job' + reqId,
            execution_status: 'completed',
            exit_status: { status: 'ok', message: 'step msg' + reqId }

        }],
        end_time: '2022-06-10T16:00:00.000Z',
        parameters: [
            {
                name: 'ProcessType',
                value: 'paramValue' + reqId
            }
        ],
        status: 'OK',
        log_file_path: '/test/log.txt'
    };
};
var jobExecutionSearchResponseMock = {
    responseList: {
        req1: {
            data: getResponseData('1')
        },
        req2: {
            data: getResponseData('2')
        }
    }
};


var searchJobResponseMock = {
    ok: true,
    data: {
        hits: [
            getResponseData('1'),
            getResponseData('2')
        ]
    },
    count: 2,
    total: 10,
    start: 0
};

var attributeDefinitionsResponseMock = {
    ok: true,
    data: {
        data: [
            getResponseData('1'),
            getResponseData('2')
        ],
        count: 2,
        total: 10,
        start: 0
    }
};
const executeJobResponseMock = {
    ok: true,
    data: getResponseData('1')

};

var AppUtil = {
    get: sinon.stub(),
    getRequestFormOrParams: sinon.stub()
};


var RenderTemplateHelper = {
    getRenderedHtml: () => 'rendered html'
};

var ProductListMgrMock = {
    getProductLists: sinon.stub()
};

var CustomerMgrMock = {
    getCustomerByLogin: sinon.stub(),
    getCustomerByCustomerNumber: sinon.stub()
};
var PriceBookMgrMock = {
    getAllPriceBooks: sinon.stub(),
    getPriceBook: sinon.stub()
};

var CustomObjectMgrMock = {
    getCustomObject: () => {},
    createCustomObject: () => {},
    queryCustomObjects: () => {},
    remove: () => {}
};

module.exports = {
    jobExecutionSearchResponseMock,
    executeJobResponseMock,
    searchJobResponseMock,
    RenderTemplateHelper,
    AppUtil,
    ProductListMgrMock,
    CustomerMgrMock,
    PriceBookMgrMock,
    CustomObjectMgrMock,
    attributeDefinitionsResponseMock
};
