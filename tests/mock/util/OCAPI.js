'use strict';
const OCAPI = {
    RequestBuilder: class OcapiRequestBuilder {
        constructor() {
            this.reqId = null;
            this.ocapiEndpoint = null;
            this.body = '';
            this.parameters = [];
            this.ocapiType = null;
            this.sorts = [];
            this.expandToAttrs = [];
        }
        execute() {}
        setOcapi(endpoint) {
            this.ocapiEndpoint = endpoint;
            return this;
        }
        setPageSize() {
            return this;
        }
        setQuery() {
            return this;
        }
        selectOnlySpecificAttributes() {
            return this;
        }
        sortBy() {
            return this;
        }
        setRequestId() {
            return this;
        }
        addParameters() {
            return this;
        }
        setBody() {
            return this;
        }
        expandToMoreAttributes() {
            return this;
        }
        setPageNumber() {
            return this;
        }
    },
    BatchBuilder: class ocapiBatchRequestBuilder {
        constructor() {
            this.ocapiRequestList = [];
            this.reqSequenceNo = 0;
        }
        execute() {}

        addRequest() {
            return this;
        }

    },
    utils: {
        getBatchResponseError: function (batchResponse) {
            var errorResult = null;
            if (batchResponse.error) {
                errorResult = batchResponse;
            }
            return errorResult;
        }
    },
    ENDPOINTS: {
        JOB_EXECUTION_SEARCH: {
            api: 'job_execution_search',
            method: 'POST',
            siteSpecific: false,
            type: 'DATA',
            supportsPagination: true
        }
    }
};

module.exports = OCAPI;
