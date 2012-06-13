var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async');

exports.TemplateLoader = function (opts) {
    opts = opts || {};
    opts.templateDir = opts.templateDir || '';
    opts.objectName = opts.objectName || 'loadTemplate';

    return function (store, callback) {
        if (store.options.compile) {
            var dir = path.join(store.path, opts.templateDir);

            compileTemplates(dir, function(err, compiled) {
                if (err) {
                    return callback(err);
                }

                renderScript('clientCompiled.js.tmpl', {
                    objectName: opts.objectName,
                    compiled: compiled
                }, callback);
            });
        } else {
            renderScript('clientAjax.js.tmpl', {
                objectName: opts.objectName,
                templatePath: opts.templateDir
            }, callback);
        }
    };

    function compileTemplates (dir, callback) {
        listRecursive(dir, function (err, files) {
            if (err) {
                return callback(err);
            }

            async.map(files, function(file, callback) {
                fs.readFile(path.join(dir, file), 'utf8', function (err, source) {
                    if (err) {
                        return callback(err);
                    }

                    var compiled = _.template(source).source;
                    return callback(null, '"'+file+'":'+compiled);
                });
            }, function (err, compiled) {
                if (err) {
                    return callback(err);
                }

                callback(null, '{'+compiled.join(',')+'}');
            });
        });
    };

    function listRecursive (dir, callback) {
        fs.readdir(dir, function (err, entries) {
            async.map(entries, function(entry, callback) {
                fs.stat(path.join(dir, entry), function(err, stats) {
                    if (err) {
                        return callback(err);
                    }

                    if (stats.isFile()) {
                        return callback(null, [entry]);
                    } else if (stats.isDirectory()) {
                        listRecursive(path.join(dir, entry), function(err, files) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, _.map(files, function (file) {
                                return path.join(entry, file);
                            }));
                        });
                    }
                });
            }, function(err, fileLists) {
                if (err) {
                    return callback(err);
                }

                return callback(null, _.flatten(fileLists, true));
            });
        });
    };
};

function renderScript (script, context, callback) {
    fs.readFile(path.join(__dirname, script), 'utf8', function (err, template) {
        if (err) {
            return callback(err);
        }

        return callback(null, _.template(template, context));
    })
};
