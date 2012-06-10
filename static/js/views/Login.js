timeit.LoginView = Backbone.View.extend({
    template: 'login.html',

    rendered: function () {
        this.$('input[name="openid"]').focus();
    }
}).mixin(Backbone.ViewMixins.Template);
