var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async'),
    utils = require('../utils');

exports.TemplateLoader = function (opts) {
    opts = _.extend({
        templatesPath: undefined,
        templatesUrl: '',
        objectName: 'loadTemplate'
    }, opts);

    return function (store, callback) {
        if (store.compile) {
            compileTemplates(opts.templatesPath, function(err, compiled) {
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
                templatePath: opts.templatesUrl
            }, callback);
        }
    };

    function compileTemplates (dir, callback) {
        utils.fsFind(dir, {
            filter: function (entry) {
                return !entry.stats.isDirectory()
            }
        }, function (err, files) {
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
