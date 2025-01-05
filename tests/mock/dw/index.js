'use strict';
const Calendar = require('./util/Calendar');

module.exports = {
    system: {
        Response: require('../util/Response'),
        System: {
            getInstanceHostname: () => 'localhost',
            getInstanceTimeZone: () => 'UTC',
            getCalendar: () => new Calendar()
        }
    },
    svc: {
        Result: {
            SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
        }
    }
};
