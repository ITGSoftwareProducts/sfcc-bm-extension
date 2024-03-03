'use strict';

module.exports = function (message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible modal-dialog modal-dialog-scrollable modal-dialog-centered' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button><div class="modal-content">' + message + '</div></div>';

    $('.error-messaging').append(errorHtml);
};
