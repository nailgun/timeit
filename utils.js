var utils = exports;

exports.throwOnErr = function(err) {
    if (err) {
        throw err;
    }
}

exports.noErr = function(callback) {
    return function(err) {
        utils.throwOnErr(err);
        var args = Array.prototype.slice.call(arguments, 1)
        return callback.apply(this, args);
    }
}

exports.jsonDumpFormErrors = function(res) {
    return function(form) {
        var report = {};
        report.field_errors = form.field_errors;
        report.errors = form.errors;
        res.errJson(report);
    }
}
