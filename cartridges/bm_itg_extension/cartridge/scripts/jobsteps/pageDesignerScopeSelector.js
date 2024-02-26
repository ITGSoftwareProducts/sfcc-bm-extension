'use strict';
var Status = require('dw/system/Status');

const ORGANIZATION_SCOPE = 'organization';
const SITE_SCOPE = 'site';
const PRIVATE_LIBRARY_ID = 'Library';

/**
 * Selects the Correct Process
 * @param {Object} params - Job params.
 * @returns {dw.system.Status} status
*/
function execute(params) {
    var scope = params.Scope;
    var siteLibraryId = params.LibraryId;
    if ((scope === ORGANIZATION_SCOPE && siteLibraryId === PRIVATE_LIBRARY_ID) || (scope === SITE_SCOPE && siteLibraryId !== PRIVATE_LIBRARY_ID)) {
        var STATUS = {
            STOP: 'STOP'
        };
        return new Status(Status.OK, STATUS.STOP);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
