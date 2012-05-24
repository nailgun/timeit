window.timeit = {
    current_activity: null,
    start_time: null,
    notifications: false,
    time_elapsed_ms: function() {
        return new Date().getTime() - timeit.start_time.getTime();
    }
};

function set_activity(name) {
    $.getJSON('set-activity', { name: name }, function(data) {
        $('#current_activity_name').text(name);
        timeit.current_activity = name;
        timeit.start_time = new Date();
        update_timer();
    });
}

function stop_activity() {
    $.getJSON('stop-activity', function(data) {
        $('#current_activity_name').text('No activity');
        timeit.current_activity = null;
        timeit.start_time = null;
    });
}

function update_timer() {
    if (timeit.start_time) {
        var total_ms = timeit.time_elapsed_ms();

        if (timeit.notifications) {
            var minutes = Math.floor(total_ms / (1000 * 60));
            if (minutes % 27 == 0) {
                var popup = window.webkitNotifications.createNotification('', 'TimeIt', timeit.current_activity);
                popup.show();
                setTimeout(function() {
                    popup.cancel();
                }, 2000);
            }
        }

        var hours = Math.floor(total_ms / (1000 * 60 * 60));
        total_ms -= hours * (1000 * 60 * 60);
        var minutes = Math.floor(total_ms / (1000 * 60));
        total_ms -= minutes * (1000 * 60);
        var seconds = Math.floor(total_ms / 1000);
        var ms = total_ms - (seconds * 1000);

        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        $('#timer').text(hours+':'+minutes+':'+seconds);
        setTimeout(update_timer, 1000);
    }
}

function enableControls() {
    $('#current_activity').click(function() {
        $('#activity_form').show();
    });

    $('#activity_form_button').click(function() {
        var name = $('#activity_form_name').val();
        set_activity(name);
        $('#activity_form').hide();
    });

    $('#activity_form_cancel').click(function() {
        $('#activity_form').hide();
    });

    $('#activity_form_stop').click(function() {
        stop_activity();
        $('#activity_form').hide();
        $('#timer').text('');
    });
}

function update_notifications(value) {
    var enabled = window.webkitNotifications.checkPermission() == 0 && value;
    if (!enabled) {
        $('#toggle_notify').text('Enable notifications');
    } else {
        $('#toggle_notify').text('Disable notifications');
    }

    timeit.notifications = enabled;
}

function logged_in() {
    $('.logged_in').show();

    $.getJSON('current-activity', function(data) {
        if (data.length) {
            var activity = data[0];

            $('#current_activity_name').text(activity.name);
            timeit.current_activity = activity.name;
            timeit.start_time = new Date(activity.start_time);
            update_timer();
        } else {
            $('#current_activity_name').text('No activity');
        }

        enableControls();
    });
}

$(function() {
    if (window.webkitNotifications) {
        update_notifications(true);

        $('#toggle_notify').click(function(e) {
            var enable = !timeit.notifications;
            if (enable && window.webkitNotifications.checkPermission() != 0) {
                window.webkitNotifications.requestPermission(function() {
                    update_notifications(enable);
                });
            } else {
                update_notifications(enable);
            }
            e.preventDefault();
        });

        if (window.webkitNotifications.checkPermission() != 0) {
            window.webkitNotifications.requestPermission(function() {
                timeit.notifications = window.webkitNotifications.checkPermission() == 0;
            });
        } else {
            timeit.notifications = true;
        }
    } else {
        $('#toggle_notify').remove();
    }

    $.getJSON('login-status', function(data) {
        if (data['logged_in']) {
            logged_in();
        } else {
            $('.not_logged_in').show();
        }
    });
});
