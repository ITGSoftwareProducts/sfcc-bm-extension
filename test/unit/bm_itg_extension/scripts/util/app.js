
'use strict';

const proxyquire = require('proxyquire').noCallThru();
const assert = require('chai').assert;
const session = require('../../../../mock//util/Session');
const formErrors = require('../../../../../cartridges/bm_itg_extension/cartridge/scripts/formErrors');

describe('app', function () {
    global.session = session;
    const originalRequest = global.request;
    const formsModuleMock = function () {
        return {
            session
        };
    };

    const app = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/util/app.js', {
        './forms/forms': formsModuleMock,
        '../formErrors': formErrors
    });

    afterEach(function () {
        global.request = originalRequest;
    });

    it('should return an empty object when there are no parameters in httpParameterMap', function () {
        const request = {
            httpParameterMap: {}
        };
        global.request = request;

        const result = app.getRequestFormOrParams();

        assert.deepEqual(result, {});
    });

    it('should return an object with key value pairs when there are parameters in httpParameterMap', function () {
        var items = {
            parameterNames: {
                names: ['param1', 'param2', 'param3'],
                iterator: function () {
                    var index = 0;
                    return {
                        hasNext: function () {
                            return index < items.parameterNames.names.length;
                        },
                        next: function () {
                            return items.parameterNames.names[index++];
                        }
                    };
                },
                length: 3
            },
            get: function () {
                return {
                    rawValue: 'value'
                };
            }
        };
        var request = {
            httpParameterMap: items
        };
        global.request = request;

        const result = app.getRequestFormOrParams();

        assert.deepEqual(result, { param1: 'value', param2: 'value', param3: 'value' });
    });

    it('should return an object with key values pairs when there are parameters in httpParameterMap', function () {
        var items = {
            parameterNames: {
                names: ['param1', 'param2', 'param3'],
                iterator: function () {
                    var index = 0;
                    return {
                        hasNext: function () {
                            return index < items.parameterNames.names.length;
                        },
                        next: function () {
                            return items.parameterNames.names[index++];
                        }
                    };
                },
                length: 3
            },
            get: function () {
                return {
                    rawValues: ['value1', 'value2']
                };
            }
        };
        var request = {
            httpParameterMap: items
        };
        global.request = request;

        const result = app.getRequestFormOrParams();

        assert.deepEqual(result, { param1: ['value1', 'value2'], param2: ['value1', 'value2'], param3: ['value1', 'value2'] });
    });

    it('should normalize key names by removing \'[]\' from the end of the key', function () {
        var items = {
            parameterNames: {
                names: ['param1[]', 'param2[]', 'param3[]'],
                iterator: function () {
                    var index = 0;
                    return {
                        hasNext: function () {
                            return index < items.parameterNames.names.length;
                        },
                        next: function () {
                            return items.parameterNames.names[index++];
                        }
                    };
                },
                length: 3
            },
            get: function () {
                return {
                    rawValues: ['value1', 'value2']
                };
            }
        };
        var request = {
            httpParameterMap: items
        };
        global.request = request;

        const result = app.getRequestFormOrParams();

        assert.deepEqual(result, { param1: ['value1', 'value2'], param2: ['value1', 'value2'], param3: ['value1', 'value2'] });
    });
});
