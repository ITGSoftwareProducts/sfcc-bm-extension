'use strict';

function getCurrent() {
    return {
        ID: 'siteID1',
        getID: function () {
            return 'siteID1';
        },
        setCustomPreferenceValue: function () {
        },
        getTimezone: () => 'America/New_York',
        getTimezoneOffset: () => -5 * 60 * 60 * 1000
    };
}
function getAllSites() {

}

module.exports = {
    getAllSites: getAllSites,
    getCurrent: getCurrent

};
