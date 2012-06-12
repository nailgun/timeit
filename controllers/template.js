var templates = require('../templates'),
    _ = require('underscore'),
    app = require('../app'),
    uglify = require('uglify-js'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    utils = require('../utils'),
    crypto = require('crypto'),
    cache = require('../cache');

exports.index = function(indexFileName, staticDirName) {
    return function(req, res) {
        var context = templates.Context();

        context.wrap('script', function() {
            var callback = arguments[0];
            var scripts = Array.prototype.slice.call(arguments, 1);

            //if (app.config.debug) {
            if (false) {
                var data = '';
                _.each(scripts, function(scriptName) {
                    data += '<script src="'+scriptName+'"></script>\n';
                });
                callback(null, data);
            } else {
                async.map(scripts, function(scriptName, callback2) {
                    var scriptPath = path.join(staticDirName, scriptName);
                    fs.readFile(scriptPath, function (err, scriptBody) {
                        if (err) {
                            callback2(err);
                        }

                        var ast = uglify.parser.parse(scriptBody.toString());
                        ast = uglify.uglify.ast_mangle(ast);
                        ast = uglify.uglify.ast_squeeze(ast);
                        scriptBody = uglify.uglify.gen_code(ast);

                        callback2(null, scriptBody);
                    });
                }, utils.noErr(function(scriptBodies) {
                    var code = scriptBodies.join(';\n');
                    var hash = crypto.createHash('md5');
                    hash.update(code);
                    var digest = hash.digest('hex');

                    cache.set('scripts', code, utils.noErr(function() {
                        callback(null, '<script src="site.js?'+digest+'"></script>\n');
                    }));
                }));
            }
        });

        templates.renderToResponse(res, indexFileName, context, {
            cache: true
        });
    };
};

exports.scripts = function() {
    return function(req, res) {
        cache.get('scripts', utils.noErr(function(cache) {
            res.header('Content-Type', 'text/javascript');
            res.end(cache);
        }));
    };
};
