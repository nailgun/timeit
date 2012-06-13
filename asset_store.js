var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    uglify = require('uglify-js'),
    cleanCss = require('clean-css');

module.exports = function(storePath, contentCache, opts) {
    opts = opts || {};

    var store = {
        path: storePath,
        contentCache: contentCache,
        options: opts
    };

    var assets = {};

    store.register = function (name, items) {
        var overwrite = name in assets;
        if (overwrite) {
            contentCache.invalidate('asset', name);
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
        if (!opts.compile) {
            return callback(new Error('not compiled'));
        }

        contentCache.get('asset', name, function(err, content) {
            if (!err) {
                callback(null, content);
            } else {
                compile(name, function(err, content) {
                    callback(err, content);
                    if (!err) {
                        contentCache.set('asset', name, content, function(err) {
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
        if (opts.compile) {
            return callback(null, parts.prefix+name+'?'+assets[name].digest+parts.postfix);

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

        return opts.compile ? [function (callback) {
        }] : [];
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
                callback(err);
            }

            var ast = uglify.parser.parse(code.toString());
            ast = uglify.uglify.ast_mangle(ast);
            ast = uglify.uglify.ast_squeeze(ast);
            code = uglify.uglify.gen_code(ast);

            callback(err, code);
        });
    };

    function compileCss(items, callback) {
        readAll(items, function(err, css) {
            if (err) {
                callback(err);
            }

            css = cleanCss.process(css);
            callback(err, css);
        });
    };

    function readAll(items, separator, callback) {
        if (typeof separator === 'function' && typeof callback === 'undefined') {
            callback = separator;
            separator = '';
        }

        async.map(items, function(item, callback) {
            if (!_.isFunction(item)) {
                var filePath = path.join(storePath, item);
                fs.readFile(filePath, 'utf8', callback);
            } else {
                item(store, callback);
            }

        }, function(err, contents) {
            if (err) {
                callback(err);
            } else {
                callback(null, contents.join(separator));
            }
        });
    };

    return store;
};
