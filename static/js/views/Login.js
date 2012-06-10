timeit.LoginView = timeit.utils.View.extend({
    template: 'login.html',

    rendered: function () {
        this.$('input[name="openid"]').focus();
    }
}).mixin(timeit.utils.TemplateMixin);
