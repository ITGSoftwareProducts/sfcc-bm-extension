'use strict';

function Response() {
    this.base = {};
    this.contentTypeSet = false;
    this.headersSet = false;
    this.writer = {
        printed: '',
        print: function (content) {
            this.printed = content;
        }
    };
}

Response.prototype = {
    X_CONTENT_TYPE_OPTIONS: 'nosniff',

    setContentType: function setContentType() {
        this.contentTypeSet = true;
    },
    setHttpHeader: function setHttpHeader() {
        this.headersSet = true;
    },
    addHttpHeader: () => {}
};
Response.writer = {
    print: () => {},
    write: () => {}
};
Response.setContentType = Response.prototype.setContentType;
Response.setHttpHeader = Response.prototype.setHttpHeader;
Response.getWriter = function () { return Response.writer; };
Response.addHttpHeader = Response.prototype.addHttpHeader;

module.exports = Response;
