var _= require('underscore'),
    cache = require('./cache'),
    app = require('./app'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    checkErr = require('nw.utils').checkErr,
    crypto = require('crypto');

exports.template = function(source, context, callback) {
    var compiled = _.template(source);

    var templateFunc = function(context, callback) {
        context = context || {};
        context._done = [];

        var data = compiled(context);
        context._done.unshift(function(callback) {
            callback(null, data);
        });

        async.waterfall(context._done, function (err, data) {
            callback(err, data);
        });
    };

    if (context === undefined) {
        return templateFunc;
    } else {
        return templateFunc(context, callback);
    }
};

exports.Context = function(initial) {
    var context = initial || {};
    var placeholderId = 1;

    context.wrap = function(name, originalFunc) {
        function wrapper() {
            var args = Array.prototype.slice.call(arguments);
            var id = placeholderId++;
            var placeholder = '-+!__TI_PLCHLDR_'+id+'__!+-';

            context._done.push(function(data, callback) {
                args.unshift(function(err, replacement) {
                    if (!err) {
                        data = data.replace(placeholder, replacement);
                    }
                    callback(err, data);
                });

                originalFunc.apply(null, args);
            });
            return placeholder;
        }
        context[name] = wrapper;
    };

    return context;
};

exports.renderToResponse = function(res, templateFile, context, opts, next) {
    opts = opts || {};

    if (opts.cache) {
        cache.get('template:'+templateFile, function (err, cached) {
            if (err) {
                render();
            } else {
                res.end(cached);
            }
        });
    } else {
        render();
    }

    function render() {
        fs.readFile(templateFile, checkErr(next, function (data) {
            exports.template(data.toString(), context, checkErr(next, function (data) {
                res.end(data);
                if (opts.cache) {
                    cache.set('template:'+templateFile, data, checkErr(next, function() {
                    }));
                }
            }));
        }));
    }
};

exports.Renderer = function(templatesPath) {
    var renderer = {
        templatesPath: templatesPath,
        contextExtensions: []
    };

    renderer.render = function(name, context, callback) {
        if (context.wrap === undefined) {
            context = exports.Context(context);
        }

        _.each(renderer.contextExtensions, function(ext) {
            context = ext(context);
        });

        var templateFile = path.join(templatesPath, name);
        fs.readFile(templateFile, 'utf8', function(err, content) {
            if (err) {
                return callback(err);
            }

            return exports.template(content, context, callback);
        });
    };

    renderer.renderToRes = function(res, name, context, next) {
        context = context || exports.Context();
        renderer.render(name, context, checkErr(next, function(content) {
            res.end(content);
        }));
    };

    renderer.middleware = function () {
        return function (req, res, next) {
            res.render = function (name, context) {
                if (res.app) {
                    context = _.extend({},
                        context || {},
                        res.app._locals
                    );
                    _.each(res.app.dynamicViewHelpers, function (helper, name) {
                        context[name] = helper(req, res);
                    })
                }
                renderer.renderToRes(res, name, context, next);
            };
            next();
        };
    };

    return renderer;
};
