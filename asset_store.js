var _ = require('underscore'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    uglify = require('uglify-js'),
    cleanCss = require('clean-css');

module.exports = function(opts) {
    var store = {
        assetRoot: opts.assetRoot,
        assetUrl: opts.assetUrl,
        contentCache: opts.contentCache,
        compile: opts.compile,
    };

    var assets = {};

    store.register = function (name, items) {
        var overwrite = name in assets;
        if (overwrite) {
            store.contentCache.invalidate('asset', name);
        }

        var asset = assets[name] = {};

        if (!_.isArray(items)) {
            items = [items];
        }
        asset.items = items;

        var hash = crypto.createHash('md5');
        hash.update(_.map(items, function(item) {
            if (!_.isFunction(item)) {
                return item;
            } else {
                // TODO: hash contents?
                return 'function';
            }
        }).join(';'));
        asset.digest = hash.digest('hex');
    };

    store.getContent = function (name, callback) {
        if (!assets[name]) {
            return callback(new Error('not registered'));
        }
        if (!store.compile) {
            return callback(new Error('not compiled'));
        }

        store.contentCache.get('asset', name, function(err, content) {
            if (!err) {
                callback(null, content);
            } else {
                compile(name, function(err, content) {
                    callback(err, content);
                    if (!err) {
                        store.contentCache.set('asset', name, content, function(err) {
                            // TODO: warn on err
                        });
                    }
                });
            }
        });
    };

    store.getContentType = function (name) {
        if (name.slice(-3) === '.js') {
            return 'text/javascript';
        } else if (name.slice(-4) === '.css') {
            return 'text/css';
        } else {
            return 'text/plain';
        }
    };

    store.getInclude = function (name, callback) {
        var parts;
        if (name.slice(-3) === '.js') {
            parts = {
                prefix: '<script src="',
                postfix: '"></script>\n',
                inlinePrefix: '<script>',
                inlinePostfix: '</script>\n'
            };
        } else if (name.slice(-4) === '.css') {
            parts = {
                prefix: '<link href="',
                postfix: '" rel="stylesheet">\n',
                inlinePrefix: '<style>',
                inlinePostfix: '</style>\n'
            };
        } else {
            parts = {
                prefix: '',
                postfix: '\n',
                inlinePrefix: '',
                inlinePostfix: '\n'
            };
        }

        joinInclude (name, parts, callback);
    };

    function joinInclude (name, parts, callback) {
        if (store.compile) {
            return callback(null,
                    parts.prefix+
                    path.join(store.assetUrl, name)+
                    '?'+assets[name].digest+
                    parts.postfix);
        } else {
            async.map(assets[name].items, function (item, callback) {
                if (!_.isFunction(item)) {
                    return callback(null, parts.prefix + item + parts.postfix);
                } else {
                    item(store, function (err, content) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, parts.inlinePrefix + content + parts.inlinePostfix);
                    });
                }

            }, function (err, includes) {
                if (err) {
                    return callback(err);
                }
                callback(null, includes.join(''));
            });
        }
    };

    store.templates = function (opts) {
        opts = opts || {};
        opts.subDir = opts.subDir || '';
        opts.objectName = opts.objectName || 'templates';

        return store.compile ? [function (callback) {
        }] : [];
    };

    store.middleware = function () {
        var regexp = RegExp('^'+path.join('/', store.assetUrl, '(.+)')+'$');

        return function (req, res, next) {
            var pathname = url.parse(req.url).pathname;
            var m = regexp.exec(pathname);
            if (!m) {
                return next();
            }
            var assetName = m[1];

            if (assetName in assets) {
                store.getContent(assetName, function (err, content) {
                    if (err) {
                        next(err);
                    } else {
                        res.header('Content-Type', store.getContentType(assetName));
                        res.end(content);
                    }
                });
            } else {
                next();
            }
        };
    };

    function compile(name, callback) {
        var items = assets[name].items;

        if (name.slice(-3) === '.js') {
            compileJs(items, callback);
        } else if (name.slice(-4) === '.css') {
            compileCss(items, callback);
        } else {
            readAll(items, callback);
        }
    };

    function compileJs(items, callback) {
        readAll(items, ';\n', function(err, code) {
            if (err) {
                return callback(err);
            }

            var ast = uglify.parser.parse(code.toString());
            ast = uglify.uglify.ast_mangle(ast);
            ast = uglify.uglify.ast_squeeze(ast);
            code = uglify.uglify.gen_code(ast);

            return callback(err, code);
        });
    };

    function compileCss(items, callback) {
        readAll(items, function(err, css) {
            if (err) {
                return callback(err);
            }

            css = cleanCss.process(css);
            return callback(err, css);
        });
    };

    function readAll(items, separator, callback) {
        if (typeof separator === 'function' && typeof callback === 'undefined') {
            callback = separator;
            separator = '';
        }

        async.map(items, function(item, callback) {
            if (!_.isFunction(item)) {
                var filePath = path.join(store.assetRoot, item);
                fs.readFile(filePath, 'utf8', callback);
            } else {
                item(store, callback);
            }

        }, function(err, contents) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, contents.join(separator));
            }
        });
    };

    return store;
};
