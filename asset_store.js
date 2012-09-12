var _ = require('underscore'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    utils = require('./utils'),
    uglify = require('uglify-js'),
    cleanCss = require('clean-css'),
    checkErr = require('nw.utils').checkErr;

module.exports = function(opts) {
    var store = _.extend({
        urlPrefix: 'assets',
        contentCache: null,
        compile: false,
        uglifyOptions: {}
    }, opts);

    var assets = {};

    store.register = function (name, root, items) {
        var overwrite = name in assets;
        if (overwrite) {
            store.contentCache.invalidate('asset', name, function (err) {
                if (err) {
                    // TODO: warn
                }
            });
        }

        var asset = assets[name] = {};

        if (!_.isArray(items)) {
            items = [items];
        }
        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (!_.isObject(item) && !_.isFunction(item)) {
                items[i] = {
                    url: item,
                    file: item
                };
            }
        }
        asset.name = name;
        asset.items = items;
        asset.root = root;
        asset.digest = null;
    };

    store.registerDir = function (name, root, callback) {
        var regexp = /(\.js$)|(\.css$)/;

        utils.fsFind(root, {
            filter: function (entry) {
                return regexp.test(entry.filename);
            }
        }, checkErr(callback, function (files) {
            _.each(files, function (filename) {
                var url = path.join(name, filename);
                store.register(url, root, [{
                    url: url,
                    file: filename
                }]);
            });

            callback && callback();
        }));
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
        var asset = assets[name];

        if (store.compile) {
            function onReady (err) {
                if (err) {
                    return callback(err);
                }

                var include = parts.prefix +
                              path.join(store.urlPrefix, name) +
                              '?' +
                              asset.digest +
                              parts.postfix;
                callback(null, include);
            }

            if (asset.digest) {
                onReady(null);
            } else {
                calcDigest(asset, onReady);
            }
        } else {
            async.map(asset.items, function (item, callback) {
                if (!_.isFunction(item)) {
                    return callback(null, parts.prefix + item.url + parts.postfix);
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
        var regexp = RegExp('^'+path.join('/', store.urlPrefix, '(.+)')+'$');

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
        var asset = assets[name];

        if (name.slice(-3) === '.js') {
            compileJs(asset, callback);
        } else if (name.slice(-4) === '.css') {
            compileCss(asset, callback);
        } else {
            readAll(asset, callback);
        }
    };

    function compileJs(asset, callback) {
        readAll(asset, ';\n', function(err, code) {
            if (err) {
                return callback(err);
            }

            var ast = uglify.parser.parse(code.toString());
            ast = uglify.uglify.ast_mangle(ast, store.uglifyOptions);
            ast = uglify.uglify.ast_squeeze(ast, store.uglifyOptions);
            code = uglify.uglify.gen_code(ast, store.uglifyOptions);

            return callback(err, code);
        });
    };

    function compileCss(asset, callback) {
        readAll(asset, function(err, css) {
            if (err) {
                return callback(err);
            }

            css = cleanCss.process(css);
            return callback(err, css);
        });
    };

    function readAll(asset, separator, callback) {
        if (typeof separator === 'function' && typeof callback === 'undefined') {
            callback = separator;
            separator = '';
        }

        async.map(asset.items, function(item, callback) {
            if (!_.isFunction(item)) {
                var filePath = path.join(asset.root, item.file);
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

    function calcDigest (asset, callback) {
        store.getContent(asset.name, function (err, content) {
            if (err) {
                return callback(err);
            }
            var hash = crypto.createHash('md5');
            hash.update(content);
            asset.digest = hash.digest('hex');
            callback(null);
        });
    };

    return store;
};
