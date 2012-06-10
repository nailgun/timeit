(function() {
    var oldExtend = Backbone.View.extend;
    Backbone.View.extend = function() {
        var child = oldExtend.apply(this, arguments);
        child.mixin = function (mixin) {
            mixinView(child, mixin);
            return child;
        };
        return child;
    };
    
    function mixinView (viewClass, mixin) {
        function extend (dst, src) {
            for (var k in src) {
                if (src.hasOwnProperty(k) && !dst.hasOwnProperty(k)) {
                    dst[k] = src[k];
                }
            }
        }

        var viewProto = viewClass.prototype;
        if (typeof mixin.events == 'object') {
            if (typeof viewProto.events === 'undefined') {
                viewProto.events = {};
            }
            if (typeof viewProto.events === 'object') {
                extend(viewProto.events, mixin.events);
            }
        }
        if (typeof mixin.className == 'string' && typeof viewProto.className == 'string') {
            viewProto.className += ' '+mixin.className;
        }
        extend(viewProto, mixin);
    }

    Backbone.ViewMixins = {};

    Backbone.ViewMixins.Template = {
        render: function () {
            var view = this;
            var args = arguments;

            function setHtml(html) {
                view.$el.html(html);
                if (view.rendered !== undefined) {
                    view.rendered.apply(view, args);
                }
            }

           _.extTemplate(view.template, function(template) {
                var html = null;
                if (typeof view.context === 'object') {
                    html = template(view.context);
                } else if (typeof view.context === 'undefined') {
                    html = template();
                }

                if (html !== null) {
                    setHtml(html);
                } else if (typeof view.context === 'function') {
                    var callback = function(context) {
                        var html = template(context);
                        setHtml(html);
                    };

                    var args2 = Array.prototype.slice.call(args);
                    args2.unshift(callback);
                    view.context.apply(view, args2);
                }
            });
            return this;
        }
    };
})();
