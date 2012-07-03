var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async');

exports.TemplateLoader = function (opts) {
    opts = opts || {};
    opts.templateDir = opts.templateDir || '';
    opts.objectName = opts.objectName || 'loadTemplate';

    return function (store, callback) {
        if (store.compile) {
            var dir = path.join(store.assetRoot, opts.templateDir);

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

            files = _.filter(files, function (file) {
                return file[0] != '.';
            });

            async.map(files, function(file, callback) {
                fs.readFile(path.join(dir, file), 'utf8', function (err, source) {
                    if (err) {
                        return callback(err);
                    }

                    var compiled;
                    try {
                        compiled = _.template(source).source;
                    } catch (err) {
                        err.message = file + ': ' + err.message;
                        throw err;
                    }

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

exports.Inline = function (content) {
    return function (store, callback) {
        return callback(null, content);
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
