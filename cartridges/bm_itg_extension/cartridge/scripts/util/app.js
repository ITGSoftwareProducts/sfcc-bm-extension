'use strict';

/**
 * @module app
 */

var app = function () { };

app.forms = require('./forms/forms')(session);

app.formErrors = require('../formErrors');

/**
 *
 * Retrieves and normalizes form data from httpParameterMap
 * @returns {Object} - Object containing key value pairs submitted from the form
 */
app.getRequestFormOrParams = function () {
    var items = request.httpParameterMap;
    if (!items || !items.parameterNames) {
        return {};
    }
    var allKeys = items.parameterNames;
    var result = {};
    if (allKeys.length > 0) {
        var iterator = allKeys.iterator();
        while (iterator.hasNext()) {
            var key = iterator.next();
            var value = items.get(key);

            if (value.rawValues && value.rawValues.length > 1) {
                result[key.replace('[]', '')] = value.rawValues;
            } else {
                result[key.replace('[]', '')] = value.rawValue;
            }
        }
    }

    return result;
};

module.exports = app;
