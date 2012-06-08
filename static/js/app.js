function restartNotification() {
    if (timeit.notificationIntervalId) {
        clearInterval(timeit.notificationIntervalId);
    }

    function notify() {
        if (timeit.notifications_allowed()) {
            var text = timeit.current_activity || 'No activity';
            var popup = window.webkitNotifications.createNotification('', 'TimeIt', text);
            popup.show();
            setTimeout(function() {
                popup.cancel();
            }, 2000);
        }
    }

    timeit.notificationIntervalId = setInterval(notify, timeit.notificationInterval);
}

timeit.setActivity = function(name, tags) {
    return timeit.post('activity', {
        name: name,
        tags: tags
    }).ok(function() {
        $('#current_activity_name').text(name);
        document.title = name + ' — TimeIt';
        $('#activity_supporting_text').text('');
        timeit.current_activity = name;
        timeit.start_time = new Date();
        updateTimer();
        restartNotification();
    });
};

timeit.stopActivity = function () {
    // TODO:
    $('#current_activity_name').html('LOADER');
    document.title = 'Working... — TimeIt';
    $('#activity_supporting_text').text('');

    return timeit.post('activity/stop').ok(function(data) {
        // TODO:
        $('#current_activity_name').text('No activity');
        document.title = 'No activity — TimeIt';
        $('#timer').text('');
        timeit.current_activity = null;
        timeit.start_time = null;
        updateTimer();
        restartNotification();
    });
};

function updateTimer() {
    if (timeit.start_time) {
        var favicon = $('link[rel="shortcut icon"]').attr('href');
        if (favicon == 'ico/empty.ico') {
            $.favicon('ico/favicon.ico');
        } else {
            $.favicon('ico/empty.ico');
        }

        var total_ms = timeit.time_elapsed_ms();
        $('#timer').text(new timeit.utils.TimeDelta(total_ms).format('%H:%0M:%0S')[0]);
    } else {
        $.favicon('ico/favicon.ico');
    }
}

function enableControls() {
    $('#toggle_notify').click(function() {
        setNotifications(!$(this).hasClass('active'));
    });
}

function showTracker(settings) {
    $('#username').text(settings.username);

    if (settings.notifications || settings.notifications === undefined) {
        setNotifications(true, settings.notifications);
    } else {
        setNotifications(false);
    }

    $('#login_widget').show();

    var tracker = new TrackerView();
    $('#control').html(tracker.render().el);

    timeit.get('activity').ok(function(activity) {
        if (activity) {
            timeit.current_activity = activity.name;
            timeit.start_time = new Date(activity.start_time);
        }

        tracker.update();
        updateTimer();
        restartNotification();
        enableControls();
    });

    tracker.on('click', function() {
        new SetActivityForm().show();
    });
    tracker.on('addEarlier', function() {
        new EarlierActivityForm().show();
    });

    setInterval(updateTimer, 1000);
}

function setNotifications(requested, dontUpdateSettings) {
    timeit.notifications_requested = requested;

    if (!dontUpdateSettings) {
        timeit.post('settings', {notifications: requested ? 1 : 0});
    }

    if (window.webkitNotifications) {
        function update_toggle() {
            if (timeit.notifications_allowed()) {
                $('#toggle_notify').addClass('active');
            } else {
                $('#toggle_notify').removeClass('active');
            }
        }

        update_toggle();
        window.webkitNotifications.requestPermission(update_toggle);

    } else {
        $('#toggle_notify').remove();
    }
}

function loggedIn() {
    timeit.get('settings').ok(function(settings) {
        if (settings.username) {
            showTracker(settings);
        } else {
            var usernameView = new UsernameView();
            usernameView.on('ok', function(username) {
                settings.username = username;
                showTracker(settings);
            });
            $('#control').html(usernameView.render().el);
        }
    });
}

function startup() {
    timeit.get('version').ok(function(version) {
        $('#version').text(version);
    });

    timeit.get('auth/status').ok(function(isLoggedIn) {
        if (isLoggedIn) {
            loggedIn();
        } else {
            $('#control').html(new LoginView().render().el);
        }
    });
}

$(function() {
    $.get('csrf-token').done(function(token) {
        timeit.csrfToken = token;
        startup();
    });

    $(window).bind('beforeunload', function() {
        if (timeit.current_activity) {
            return "Keeping activity on the go!";
        }
    });
});
