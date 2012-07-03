timeit.AccountView = Backbone.View.extend({
    template: 'account.html',
    className: 'btn-group',

    events: {
        'click .ti-username': 'onUsernameClick'
    },
    
    initialize: function (username) {
        this.username = username;
    },

    context: function (callback) {
        callback({
            username: this.username
        });
    },

    rendered: function () {
        this.authLinksView = new timeit.AuthLinksView();
        
        this.$('.ti-username')
            .popover({
                title: __('Links'),
                placement: 'bottom',
                trigger: 'manual',
                content: this.authLinksView.el
            });
    },

    onUsernameClick: function (e) {
        e.preventDefault();
        this.authLinksView.render();
        this.$('.ti-username').popover('toggle');
    }
}).mixin(Backbone.ViewMixins.Template);
