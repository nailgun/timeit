(function() {
    _.mixin({
        extTemplate: extTemplate
    });

    function createContext (jsContext, data) {
        var context = data || {};
        var placeholderId = 1;
        context._this = jsContext;
        context._done = [];
        context._wrap = function (name, originalFunc) {
            function wrapper () {
                var args = Array.prototype.slice.call(arguments);
                var id = placeholderId++;
                var placeholder = '-+!__TI_PLACEHOLDER_'+id+'__!+-';

                context._done.push(function (text, callback) {
                    var replaceCallback = function (replacement) {
                        callback(text.replace(placeholder, replacement));
                    };

                    args.unshift(replaceCallback);
                    originalFunc.apply(context._this, args);
                });
                return placeholder;
            }
            context[name] = wrapper;
        };
        _.each(extTemplate.extensions, function (ext) {
            if (typeof ext === 'string') {
                ext = defaultExtensions[ext];
            }
            ext.call(context._this, context);
        });
        return context;
    };

    function extTemplate (name, callback) {
        function templateLoaded (templateFuncSync) {
            var templateFuncAsync = function (data, callback) {
                var context = createContext(this, data);
                var text = templateFuncSync.call(context._this, context);
                context._done = _.map(context._done, function (done) {
                    return function (text, callback) {
                        done(text, function (text) {
                            callback(null, text);
                        });
                    }
                });
                context._done.unshift(function (callback) {
                    callback(null, text);
                });
                async.waterfall(context._done, function (err, text) {
                    callback(text);
                });
            };

            callback(templateFuncAsync);
        }

        return extTemplate.loader(name, templateLoaded);
    };

    var defaultExtensions = {};

    defaultExtensions.include = function (context) {
        // TODO: return function
        context._wrap('include', function (callback, name, includeContext) {
            extTemplate(name, function (template) {
                template(_.extend({}, context, includeContext), callback);
            });
        });
    };

    extTemplate.extensions = _.keys(defaultExtensions);
})();
