timeit.HelpView = Backbone.View.extend({
    template: 'help.html',

    context: function (callback) {
        timeit.get('version').ok(function(version) {
            callback({
                version: version
            })
        });
    }
}).mixin(Backbone.ViewMixins.Template);
