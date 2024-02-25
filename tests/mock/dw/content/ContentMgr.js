'use strict';

function getSiteLibrary() {
    return {
        getID: function () {
            return 'mockedSiteLibraryID';
        }
    };
}
module.exports = {
    getSiteLibrary: getSiteLibrary
};
