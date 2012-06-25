timeit.AlertView = Backbone.View.extend({
    template: 'alert.html',
    className: 'alert timeit-normal',

    initialize: function (opts) {
        this.title = opts.title || '';
        this.body = opts.body || '';
        this.severity = opts.severity || 'message';
    },

    context: function (callback) {
        callback({
            title: this.title,
            body: this.body
        });
    },

    rendered: function () {
        this.$el.addClass('alert-'+this.severity);
        this.$el.alert();
    }
}).mixin(Backbone.ViewMixins.Template);
