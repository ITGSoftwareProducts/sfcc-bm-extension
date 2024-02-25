'use strict';

module.exports = {
    system: {
        Response: require('../util/Response'),
        System: {
            getInstanceHostname: () => 'localhost',
            getInstanceTimeZone: () => 'UTC'
        }
    },
    svc: {
        Result: {
            SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
        }
    }
};
