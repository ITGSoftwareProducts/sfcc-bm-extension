'use strict';

/* eslint-disable no-undef */
/**
 * This module provides often-needed helper methods for sending responses.
 * @module util/responseUtil
 */
/**
 * Transforms the provided object into JSON format and sends it as JSON response to the client.
 * @param {Object} object - Object
 */
exports.renderJSON = function (object) {
    response.setContentType('application/json');
    response.setHttpHeader(dw.system.Response.X_CONTENT_TYPE_OPTIONS, 'nosniff');
    if (object) {
        let json = JSON.stringify(object);
        response.writer.print(json);
    }
};
