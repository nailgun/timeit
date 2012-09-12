var child_process = require('child_process'),
    _ = require('underscore'),
    async = require('async'),
    path = require('path'),
    fs = require('fs');
var utils = exports;

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

exports.fsFind = function (dir, opts, callback) {
    if (_.isFunction(opts)) {
        callback = opts;
        opts = {};
    }
    opts = _.extend({
        filter: function () { return true; }
    }, opts);

    fs.readdir(dir, function (err, entries) {
        async.map(entries, function (entry, callback) {
            var filepath = path.join(dir, entry);
            fs.stat(filepath, function (err, stats) {
                if (err) {
                    return callback(err);
                }

                if (stats.isDirectory()) {
                    exports.fsFind(filepath, function (err, files) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, _.map(files, function (file) {
                            return path.join(entry, file);
                        }));
                    });
                }

                if (opts.filter({
                    filename: entry,
                    filepath: filepath,
                    stats: stats
                })) {
                    return callback(null, [entry]);
                }
            });
        }, function (err, fileLists) {
            if (err) {
                return callback(err);
            }

            return callback(null, _.flatten(fileLists, true));
        });
    });
};
