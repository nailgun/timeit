timeit.LoginView = Backbone.View.extend({
    template: 'login.html',
    
    context: function (callback) {
        timeit.get('auth/providers').ok(function (providerNames) {
            var providers = [];
            _.each(providerNames, function (providerName) {
                providers.push({name: providerName});
            });

            $.get('authicons.json').done(function (icons) {
                _.each(providers, function (provider) {
                    provider.icon = icons[provider.name];
                });

                callback({providers: providers});
            });
        });
    }
}).mixin(Backbone.ViewMixins.Template);
