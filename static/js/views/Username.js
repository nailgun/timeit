timeit.UsernameView = Backbone.View.extend({
    template: 'username.html',

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
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.ClearError);
