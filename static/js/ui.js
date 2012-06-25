(function() {
    start();

    function start () {
        $(window).on('beforeunload', function() {
            if (timeit.currentActivity()) {
                return "Keeping activity on the go!";
            }
        });

        $(function() {
            timeit.init(init1);
        });
    }

    function init1 () {
        timeit.fetchMessages();

        timeit.get('version').ok(function(version) {
            $('#version').text(version);
        });

        timeit.get('auth/status').ok(function(loginStatus) {
            if (loginStatus === 'ok') {
                init2();
            } else if (loginStatus === 'not_logged_in') {
                $('#control').html(new timeit.LoginView().render().el);
            } else if (loginStatus === 'not_confirmed') {
                var question = new timeit.QuestionView();
                question.show('Confirm registration',
                    'This will create new account. Do you really want it?');
                question.on('ok', function () {
                    timeit.post('auth/confirm').ok(function () {
                        location.href = '.';
                    });
                });
                question.on('cancel', function() {
                    location.href = 'auth/logout';
                });
            } else {
                alert('Invalid login status');
            }
        });
    }

    function init2 () {
        timeit.get('settings').ok(function(settings) {
            if (settings.username) {
                init3(settings);
            } else {
                var usernameView = new timeit.UsernameView();
                $('#control').html(usernameView.render().el);
                usernameView.on('ok', function(username) {
                    settings.username = username;
                    init3(settings);
                });
            }
        });
    }

    function init3 (settings) {
        var account = new timeit.AccountView(settings.username);
        $('#tools_div').append(account.render().el);
        $('#tools_div').show();

        var tracker = new timeit.TrackerView();
        $('#control').html(tracker.render().el);

        tracker.on('click', function() {
            new timeit.SetActivityForm().show();
        });
        tracker.on('addEarlier', function() {
            new timeit.EditActivityForm().show();
        });

        timeit.initActivity();

        setInterval(tick, 1000);
        if (settings.notifications || settings.notifications === undefined) {
            timeit.setNotifications(true, settings.notifications);
        } else {
            timeit.setNotifications(false);
        }
        $('#toggle_notify').click(function() {
            timeit.setNotifications(!$(this).hasClass('active'));
        });
    }

    function tick() {
        if (timeit.currentActivity()) {
            var favicon = $('link[rel="shortcut icon"]').attr('href');
            if (favicon == 'ico/empty.ico') {
                $.favicon('ico/favicon.ico');
            } else {
                $.favicon('ico/empty.ico');
            }

            timeit.trigger('tick');
        } else {
            $.favicon('ico/favicon.ico');
        }
    }
})();
