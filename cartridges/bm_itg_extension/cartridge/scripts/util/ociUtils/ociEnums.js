'use strict';

var ociEnums = {};

ociEnums.HTTP_METHODS = Object.freeze({
    GET: 'GET',
    POST: 'POST'
});

ociEnums.ENDPOINTS = Object.freeze({
    UPDATE_INVENTORY_RECORD: {
        api: 'availability-records/actions/batch-update',
        method: ociEnums.HTTP_METHODS.POST,
        type: 'availability'
    },
    GET_INVENTORY_RECORD: {
        api: 'availability-records/actions/get-availability',
        method: ociEnums.HTTP_METHODS.POST,
        type: 'availability'
    },
    GET_LOCATION_GRAPG_EXPORT: {
        api: 'location-graph/exports',
        method: ociEnums.HTTP_METHODS.POST,
        type: 'impex'
    },
    DOWNLOAD_LOCATION_GRAPH_EXPORT_FILE: {
        api: 'location-graph/exports/{0}/file-content',
        method: ociEnums.HTTP_METHODS.GET,
        type: 'impex'
    }
});

module.exports = ociEnums;
