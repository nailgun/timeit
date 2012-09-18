timeit.AccountView = Backbone.View.extend({
    template: 'account.html',
    tagName: 'li',
    className: 'dropdown',

    events: {
        'click .ti-notifications': 'toggleNotifications',
        'click .ti-linked': 'onLinkedClicked'
    },
    
    initialize: function (username) {
        this.username = username;
    },

    context: function (callback) {
        var self = this;
        timeit.get('auth/links').ok(function (providers) {
            callback({
                username: self.username,
                supportNotifications: !!window.webkitNotifications,
                providers: providers
            });
        });
    },

    rendered: function () {
        var self = this;

        self.updateNotificationsButton();
        timeit.on('notificationsSwitched', function() {
            self.updateNotificationsButton();
        });

        this.delegateEvents();
    },

    onUsernameClick: function (e) {
        e.preventDefault();
        this.authLinksView.render();
        this.$('.ti-username').popover('toggle');
    },

    toggleNotifications: function (e) {
        e.preventDefault();
        timeit.setNotifications(!timeit.notificationsEnabled());
    },

    updateNotificationsButton: function () {
        var $btn = this.$('.ti-notifications');
        if (timeit.notificationsEnabled()) {
            $btn.text(__('Disable notifications'));
        } else {
            $btn.text(__('Enable notifications'));
        }
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
                    question.on('rendered', function () {
                        var $ok = question.$('.ti-ok');
                        var $hold = $('<span class="badge badge-info pull-left"></span>');
                        $ok.parent().prepend($hold);
                        $ok.holdButton({
                            hold: $hold,
                            holdText: function (countdown) {
                                return __('Hold {0}...', countdown);
                            }
                        });
                        $ok.on('trigger', function () {
                            timeit.post('auth/remove-account').ok(function () {
                                timeit.redirect('.');
                            });
                        });
                    });
                }
            });
        });
    }
}).mixin(Backbone.ViewMixins.Template);
