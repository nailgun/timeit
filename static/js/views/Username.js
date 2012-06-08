var UsernameView = Backbone.View.extend({
    template: 'username',

    events: {
        'submit form': 'submit',

        'keypress input[type="text"]': 'cleanError',
        'change input': 'cleanError'
    },

    render: function () {
        var view = this;
        $.get('views/'+this.template+'.html', function(html) {
            view.$el.html(html);
            var $username = view.$el.find('input[name="username"]');
            $username.focus();
        });

        return this;
    },

    submit: function (e) {
        e.preventDefault();

        var $username = this.$el.find('input[name="username"]');
        var username = $username.val();
        if (!username) {
            $username.parents('.control-group').addClass('error');
        } else {
            var view = this;
            timeit.post('settings', {
                username: username
            }).ok(function() {
                this.trigger('ok', username);
            }).err(function(report) {
                timeit.utils.setFormErrors(this.$el, report);
            });
        }
    },

    cleanError: function(e) {
        $(e.currentTarget).removeClass('error');
        $(e.currentTarget).parents().removeClass('error');
    }
});
