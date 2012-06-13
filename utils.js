var child_process = require('child_process');
var utils = exports;

exports.throwOnErr = function(err) {
    if (err) {
        throw err;
    }
};

exports.noErr = function(callback) {
    return function(err) {
        utils.throwOnErr(err);
        var args = Array.prototype.slice.call(arguments, 1)
        return callback.apply(this, args);
    }
};

exports.jsonDumpFormErrors = function(res) {
    return function(form) {
        var report = {};
        report.field_errors = form.field_errors;
        report.errors = form.errors;
        res.errJson(report);
    }
};

exports.getGitVersion = function(callback) {
    child_process.exec('git describe --always', {
        cwd: __dirname,
        timeout: 1000,
    }, function(err, stdout, stderr) {
        var version = stdout.toString().trim();
        callback(err, version);
    });
};
