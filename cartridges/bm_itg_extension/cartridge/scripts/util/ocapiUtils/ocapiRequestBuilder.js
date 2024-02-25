'use strict';

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var ocapiEnums = require('~/cartridge/scripts/util/ocapiUtils/ocapiEnums');
var OcapiRequest = require('~/cartridge/scripts/util/ocapiUtils/ocapiRequest');

var ocapiRequestBuilder = function () {
    this.reqId = null;
    this.ocapiEndpoint = null;
    this.body = '';
    this.parameters = [];
    this.ocapiType = null;
    this.sorts = [];
    this.expandToAttrs = [];
    return this;
};

ocapiRequestBuilder.prototype.setRequestId = function (reqId) {
    if (reqId) {
        this.reqId = reqId;
        return this;
    }
    throw new Error('Invalid OCAPI RequestId.');
};

ocapiRequestBuilder.prototype.setOcapi = function (ocapiEndpoint) {
    if (ocapiEndpoint) {
        this.ocapiEndpoint = ocapiEndpoint;
        return this;
    }
    throw new Error('Invalid OCAPI Endpoint.');
};

ocapiRequestBuilder.prototype.addParameters = function () {
    if (!empty(arguments) && arguments.length > 0) {
        for (var i = 0; i < arguments.length; i++) {
            this.parameters.push(arguments[i]);
        }
        return this;
    }
    throw new Error('Invalid parameters.');
};

ocapiRequestBuilder.prototype.setBody = function (bodyObj) {
    if (!empty(bodyObj)) {
        this.body = bodyObj;
        return this;
    }
    throw new Error('Invalid body.');
};

ocapiRequestBuilder.prototype.setQuery = function (query) {
    if (!empty(query)) {
        this.query = query;
        return this;
    }
    throw new Error('Invalid query.');
};

ocapiRequestBuilder.prototype.expandToMoreAttributes = function () {
    if (!empty(arguments) && arguments.length > 0) {
        for (var i = 0; i < arguments.length; i++) {
            this.expandToAttrs.push(arguments[i]);
        }
        return this;
    }
    throw new Error('Invalid expand parameters.');
};

ocapiRequestBuilder.prototype.selectOnlySpecificAttributes = function (type, attrs) {
    if (!empty(attrs) && !empty(type)) {
        switch (type) {
            case 'search':
                this.selectedAttrs = StringUtils.format('(total, start, hits.({0}))', attrs.join(','));
                break;
            case 'get':
                this.selectedAttrs = StringUtils.format('(data.({0}))', attrs.join(','));
                break;
            default:
                break;
        }
        return this;
    }
    throw new Error('Invalid select parameters.');
};

ocapiRequestBuilder.prototype.setPageSize = function (pageSize) {
    if (!empty(pageSize)) {
        this.pageSize = pageSize;
        return this;
    }
    throw new Error('Invalid page size.');
};

ocapiRequestBuilder.prototype.setPageNumber = function (pageNumber) {
    if (!empty(pageNumber)) {
        this.pageNumber = pageNumber;
        return this;
    }
    throw new Error('Invalid page number.');
};

ocapiRequestBuilder.prototype.setOcapiType = function (ocapiType) {
    if (!empty(ocapiType)) {
        this.ocapiType = ocapiType;
        return this;
    }
    throw new Error('Invalid ocapi type.');
};

ocapiRequestBuilder.prototype.sortBy = function () {
    if (!empty(arguments) && arguments.length > 0) {
        for (var i = 0; i < arguments.length; i++) {
            this.sorts.push(arguments[i]);
        }
        return this;
    }
    throw new Error('Invalid sort by parameters.');
};

ocapiRequestBuilder.prototype.build = function () {
    var System = require('dw/system/System');

    var ocapiRequestObj = new OcapiRequest();

    ocapiRequestObj.requestId = this.reqId;
    ocapiRequestObj.ocapiEndpoint = this.ocapiEndpoint;

    if (!this.ocapiType) {
        this.ocapiType = ocapiEnums.TYPES.DATA;
    }

    var isSingleRequest = this.ocapiType !== ocapiEnums.TYPES.BATCH;

    if (!ocapiRequestObj.ocapiEndpoint) {
        throw new Error('Invalid OCAPI Endpoint.');
    }
    var ocapiVersion = '23_2';
    var ocapiEndpointUrl = StringUtils.format('s/-/dw/{0}/v{1}', ocapiRequestObj.ocapiEndpoint.type, ocapiVersion);

    var ocapiEndpointApiWithParams = ocapiRequestObj.ocapiEndpoint.api;
    if (!empty(this.parameters)) {
        for (var i = 0; i < this.parameters.length; i++) {
            ocapiEndpointApiWithParams = ocapiEndpointApiWithParams.replace('{' + i + '}', this.parameters[i]);
        }
    }
    if (ocapiRequestObj.ocapiEndpoint.siteSpecific && Site.getCurrent()) {
        ocapiEndpointUrl = StringUtils.format('{0}/sites/{1}/{2}', ocapiEndpointUrl, Site.getCurrent().getID(), ocapiEndpointApiWithParams);
    } else {
        ocapiEndpointUrl = StringUtils.format('{0}/{1}', ocapiEndpointUrl, ocapiEndpointApiWithParams);
    }

    var httpMethod = !empty(ocapiRequestObj.ocapiEndpoint) && !empty(ocapiRequestObj.ocapiEndpoint.method) ? ocapiRequestObj.ocapiEndpoint.method : ocapiEnums.HTTP_METHODS.POST;
    var body = this.body;

    if (httpMethod !== ocapiEnums.HTTP_METHODS.POST) {
        ocapiRequestObj.setHeader('x-dw-http-method-override', httpMethod);
    }

    if (httpMethod === ocapiEnums.HTTP_METHODS.GET) {
        if (isSingleRequest) {
            ocapiRequestObj.setHeader('Content-Type', 'application/json');
        }

        var queryObj = {};

        if (ocapiRequestObj.ocapiEndpoint.supportsPagination) {
            queryObj.count = this.pageSize || 10;
            queryObj.start = (queryObj.count * this.pageNumber) || 0;
        }

        if (this.expandToAttrs && this.expandToAttrs.length > 0) {
            queryObj.expand = this.expandToAttrs.join(',');
        }
        if (this.selectedAttrs && this.selectedAttrs.length > 0) {
            queryObj.select = this.selectedAttrs;
        }

        var queryString = '';
        Object.keys(queryObj).forEach(function (key) {
            var value = queryObj[key];
            queryString += StringUtils.format('&{0}={1}', key, value);
        });

        if (!empty(queryString)) {
            queryString = queryString.substring(1);
            ocapiEndpointUrl = StringUtils.format('{0}?{1}', ocapiEndpointUrl, queryString);
        }
    } else if (empty(body)) {
        if (isSingleRequest) {
            ocapiRequestObj.setHeader('Content-Type', 'application/json');
        }

        body = {
            select: '(**)'
        };

        if (this.query) {
            body.query = this.query;
        }

        if (ocapiRequestObj.ocapiEndpoint.supportsPagination) {
            body.count = this.pageSize || 10;
            body.start = (body.count * this.pageNumber) || 0;
            // eslint-disable-next-line no-underscore-dangle
            body.db_start_record_ = 0;
        }

        if (this.expandToAttrs && this.expandToAttrs.length > 0) {
            body.expand = this.expandToAttrs;
        }
        if (this.selectedAttrs && this.selectedAttrs.length > 0) {
            body.select = this.selectedAttrs;
        }

        if (this.sorts) {
            body.sorts = this.sorts;
        }
    }

    if (!empty(body)) {
        this.body = body;
        ocapiRequestObj.setBody(JSON.stringify(body));
    }

    if (isSingleRequest) {
        ocapiEndpointUrl = StringUtils.format('https://{0}/{1}', System.getInstanceHostname(), ocapiEndpointUrl);
    } else {
        ocapiRequestObj.setHeaders(
            { 'x-dw-http-method': httpMethod },
            { 'x-dw-resource-path-extension': ocapiEndpointUrl }
        );
    }

    this.body = body;

    ocapiRequestObj.setOcapiEndpointUrl(ocapiEndpointUrl);
    ocapiRequestObj.setHttpMethod(httpMethod);

    return ocapiRequestObj;
};

ocapiRequestBuilder.prototype.execute = function () {
    var ocapiServiceHelper = require('~/cartridge/scripts/util/ocapiUtils/ocapiServiceHelper');
    var ocapiReq = this.build();

    if (!ocapiReq) {
        throw new Error('Missing parameters.');
    }

    return ocapiServiceHelper.callOcapiService(ocapiReq);
};

module.exports = ocapiRequestBuilder;
