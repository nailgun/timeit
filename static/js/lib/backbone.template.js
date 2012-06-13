(function() {
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
