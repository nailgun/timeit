timeit.AuthLinksView = Backbone.View.extend({
    template: 'auth_links.html',

    events: {
        'click .ti-linked': 'onLinkedClicked'
    },

    rendered: function () {
        this.delegateEvents();
    },
    
    context: function (callback) {
        timeit.get('auth/links').ok(function (providers) {
            callback({
                providers: providers
            });
        });
    },

    onLinkedClicked: function (e) {
        e.preventDefault();
        var provider = $(e.currentTarget).data('provider');
        var question = new timeit.QuestionView();
        question.show(__('Unlink account'),
            __('Do you really want to unlink your {0} account?',
                timeit.utils.capitalize(provider))
        );

        var view = this;
        question.on('ok', function () {
            timeit.post('auth/unlink', {
                provider: provider
            }).ok(function () {
                view.render();
            }).err(function (err) {
                view.render();
                if (err.reason == 'last_link') {
                    var question = new timeit.QuestionView();
                    question.show(__('Remove account'),
                        __('This is your last link. Do you want to remove account?'));
                    question.on('ok', function () {
                        timeit.post('auth/remove-account').ok(function () {
                            timeit.redirect('.');
                        });
                    });
                }
            });
        });
    }
}).mixin(Backbone.ViewMixins.Template);
