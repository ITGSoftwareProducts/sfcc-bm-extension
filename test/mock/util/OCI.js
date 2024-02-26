'use strict';
const OCI = {
    RequestBuilder: class OciRequestBuilder {
        constructor() {
            this.action = null;
        }
        execute() {}
        setOciAction(action) {
            this.action = action;
            return this;
        }
    }
};

module.exports = OCI;
