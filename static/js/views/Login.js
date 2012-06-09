timeit.LoginView = timeit.utils.View.extend({
    template: 'login',

    rendered: function () {
        this.$('input[name="openid"]').focus();
    }
}).mixin(timeit.utils.TemplateMixin);
