(function() {
    _.mixin({
        extTemplate: extTemplate
    });

    var contextExtensions = {};
    var enabledExtensions = {};

    function extTemplate (name, callback) {
        var useExtensions;
        function wrapTemplate(template) {
            var templateFunc = function(context) {
                context = context || {};
                context._done = [];
                _.each(useExtensions, function(ext) {
                    context = ext(context);
                });
                var result = template(context);
                _.each(context._done, function(callback) {
                    callback(result);
                });
                return result;
            }

            callback(templateFunc);
        }

        if (name.slice(-5) == '.html') {
            useExtensions = enabledExtensions.dom;
            return domTemplate(name, wrapTemplate);
        } else {
            useExtensions = enabledExtensions.plain;
            return plainTemplate(name, wrapTemplate);
        }
    };

    function domTemplate (name, callback) {
        return plainTemplate(name, function (template) {
            function templateFunc(context) {
                var html = template(context);
                var $dom = $(html);
                return $dom;
            }
            return callback(templateFunc);
        });
    };

    function plainTemplate (name, callback) {
        return $.get('templates/'+name).done(function(data) {
            callback(_.template(data));
        });
    };

    extTemplate.setContextExtensions = function(which, what) {
        var extensions = enabledExtensions[which] = [];
        _.each(what, function (extName) {
            extensions.push(contextExtensions[extName]);
        });
    };

    contextExtensions.include = function (context) {
        context._includeId = 1;

        context.include = function(name) {
            var includeId = context._includeId++;
            var spanId = 'ti_include_'+includeId;
            var span = '<span id="'+spanId+'"></span>';

            context._done.push(function($dom) {
                extTemplate(name, function (template) {
                    $dom.find('#'+spanId).replaceWith(template(context));
                });
            });

            return span;
        };

        return context;
    };

    enabledExtensions.dom = [contextExtensions.include];
    enabledExtensions.plain = [];
})();
