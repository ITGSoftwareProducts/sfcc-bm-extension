window.$ = window.jQuery;
var processInclude = require('./util');
var executionList = require('./executionList');

$(document).ready(function () {
    processInclude(require('./common'));
    processInclude(require('./spinner'));
    processInclude(require('./components/clientSideValidation'));
    processInclude(require('./pagination'));
    processInclude(require('./components/toastNotification'));

    // Last Processes List Initilization
    executionList.checkProcessStatus();
    executionList.refreshExecutionList();
    executionList.handleProcessLink();
    executionList.handleCopyLink();
});
