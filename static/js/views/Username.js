timeit.UsernameView = timeit.utils.View.extend({
    template: 'username',

    events: {
        'submit form': 'submit',
    },

    rendered: function () {
        var $username = this.$('input[name="username"]');
        $username.focus();
    },

    submit: function (e) {
        e.preventDefault();

        var $username = this.$('input[name="username"]');
        var username = $username.val();
        if (!username) {
            $username.parents('.control-group').addClass('error');
        } else {
            var view = this;
            timeit.post('settings', {
                username: username
            }).ok(function() {
                view.trigger('ok', username);
            }).err(function(report) {
                timeit.utils.setFormErrors(this.$el, report);
            });
        }
    }
}).mixin(timeit.utils.TemplateMixin).mixin(timeit.utils.ClearErrorMixin);
