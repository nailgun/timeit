(function() {
    Backbone.ViewMixins.Template = {
        render: function () {
            var view = this;
            var args = arguments;

            function setHtml(html) {
                view.$el.html(html);
                view.trigger('rendered', args);
                if (view.rendered !== undefined) {
                    view.rendered.apply(view, args);
                }
            }

           _.extTemplate(view.template, function(template) {
                if (typeof view.context === 'object') {
                    return template.call(view, view.context, setHtml);
                } else if (typeof view.context === 'undefined') {
                    return template.call(view, {}, setHtml);
                } else if (typeof view.context === 'function') {
                    var callback = function (context) {
                        template.call(view, context, setHtml);
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
