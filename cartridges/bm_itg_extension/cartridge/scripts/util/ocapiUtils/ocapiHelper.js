/**
 * Check if ocapi batch response has error and return them
 * @param {Object} ocapiBatchResponse - Ocapi response.
 * @returns {Object} responseError
 */
function getBatchResponseError(ocapiBatchResponse) {
    var responseError;
    var resList = ocapiBatchResponse.responseList;
    var resIdsList = Object.keys(resList);
    for (var i = 0; i < resIdsList.length; i++) {
        var resId = resIdsList[i];
        var response = resList[resId];
        if (response.error || response.serviceError) {
            responseError = response.data;
            break;
        }
    }
    return responseError;
}

module.exports = {
    getBatchResponseError: getBatchResponseError
};
