'use strict';

var toast = function () { };

var messages = {
    0: 'A new process has been initiated.',
    1: 'Operation successful!',
    2: 'This is a warning message.',
    3: 'Oops! Something went wrong. Please try again.'
};

var classes = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'error'
};

toast.TYPES = {
    INFO: 0,
    SUCCESS: 1,
    WARNING: 2,
    ERROR: 3
};

toast.show = function (type, message) {
    var toastHTML = '<div class="toast custom rounded-5 ' + classes[type] + '-toast" role="alert" aria-live="assertive" aria-atomic="true">' +
        '<div class="toast-body d-flex align-items-center gap-5 justify-content-between">' +
        '<p class="tost-msg mb-0 text-md black d-flex align-items-center gap-3">' + (message || messages[type]) + '</p>' +
        '<div class="separator"></div><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div></div>';

    var $toastContainer = $('.toast-messaging');
    $toastContainer.html(toastHTML);
    var $toast = $toastContainer.children().last();
    var toastInstance = new bootstrap.Toast($toast[0]);
    toastInstance.show();
};

module.exports = toast;
