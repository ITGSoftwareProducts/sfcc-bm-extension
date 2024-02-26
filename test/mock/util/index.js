
exports.apply = function (param, splitParams) {
    let value = param;
    if (typeof value === 'string') {
        return param + splitParams.join('');
    } else if (Array.isArray(value)) {
        return value.concat(splitParams);
    }
    throw new TypeError('Unsupported data type for value');
};

exports.append = function () {
    return {
        apply: exports.apply
    };
};

