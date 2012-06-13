var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    uglify = require('uglify-js');

module.exports = function(storePath, contentCache, opts) {
    opts = opts || {};

    var store = {
        path: storePath,
        contentCache: contentCache
    };

    var assets = {};

    store.register = function (name, fileNames) {
        var overwrite = name in assets;
        if (overwrite) {
            contentCache.invalidate('asset', name);
        }

        var asset = assets[name] = {};

        if (!_.isArray(fileNames)) {
            fileNames = [fileNames];
        }
        asset.fileNames = fileNames;

        var hash = crypto.createHash('md5');
        hash.update(fileNames.join(';'));
        asset.digest = hash.digest('hex');
    };

    store.getContent = function (name, callback) {
        if (!assets[name]) {
            callback(new Error('not registered'));
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

    store.getInclude = function (name) {
        var include = '';
        var fileNames = store.getIncludeFileNames(name);

        if (name.slice(-3) === '.js') {
            _.each(fileNames, function(fileName) {
                include += '<script src="'+fileName+'"></script>\n';
            });
        } else if (name.slice(-4) === '.css') {
            _.each(fileNames, function(fileName) {
                include += '<link href="'+fileName+'" rel="stylesheet">\n';
            });
        } else {
            include += fileNames.join('\n');
        }

        return include;
    };

    store.getIncludeFileNames = function (name) {
        if (opts.compile) {
            return [name+'?'+assets[name].digest];
        } else {
            return assets[name].fileNames;
        }
    };


    function compile(name, callback) {
        var fileNames = assets[name].fileNames;

        if (name.slice(-3) === '.js') {
            compileJs(fileNames, callback);
        } else if (name.slice(-4) === '.css') {
            compileCss(fileNames, callback);
        } else {
            readAll(fileNames, callback);
        }
    };

    function compileJs(fileNames, callback) {
        readAll(fileNames, ';\n', function(err, code) {
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

    function compileCss(fileNames, callback) {
        readAll(fileNames, callback);
    };

    function readAll(fileNames, separator, callback) {
        if (typeof separator === 'function' && typeof callback === 'undefined') {
            callback = separator;
            separator = '';
        }

        async.map(fileNames, function(fileName, callback) {
            var filePath = path.join(storePath, fileName);
            fs.readFile(filePath, 'utf8', callback);

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
