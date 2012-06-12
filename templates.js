var _= require('underscore'),
    async = require('async'),
    fs = require('fs'),
    utils = require('./utils'),
    cache = require('./cache');

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

exports.renderToResponse = function(res, templateFile, context, opts) {
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
        fs.readFile(templateFile, utils.noErr(function (data) {
            exports.template(data.toString(), context, utils.noErr(function (data) {
                res.end(data);
                if (opts.cache) {
                    cache.set('template:'+templateFile, data, utils.noErr(function() {
                    }));
                }
            }));
        }));
    }
};
