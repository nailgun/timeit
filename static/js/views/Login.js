var LoginView = Backbone.View.extend({
    template: 'login',

    render: function () {
        var view = this;
        $.get('views/'+this.template+'.html', function(html) {
            view.$el.html(html);
            view.$el.find('input[name="openid"]').focus();
        });

        return this;
    },
});
