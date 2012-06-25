timeit.AuthLinksView = Backbone.View.extend({
    template: 'auth_links.html',
    className: 'timeit-normal',

    events: {
        'click .ti-linked': 'onLinkedClicked'
    },

    rendered: function () {
        this.delegateEvents();
    },
    
    context: function (callback) {
        timeit.get('auth/links').ok(function (providers) {
            $.get('authicons.json').done(function (icons) {
                callback({
                    providers: providers,
                    icons: icons
                });
            });
        });
    },

    onLinkedClicked: function (e) {
        e.preventDefault();
        var provider = $(e.currentTarget).data('provider');
        var question = new timeit.QuestionView();
        question.show('Unlink account',
            'Do you really want to unlink your '+
            timeit.utils.capitalize(provider)+' account?');

        var view = this;
        question.on('ok', function () {
            timeit.post('auth/unlink', {
                provider: provider
            }).ok(function () {
                view.render();
            });
        });
    }
}).mixin(Backbone.ViewMixins.Template);