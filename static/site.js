window.timeit = {
    current_activity: null,
    start_time: null,
    notifications: false,
    activity_num: 0,
    notification_interval: 10 * 60 * 1000,
    time_elapsed_ms: function() {
        return new Date().getTime() - timeit.start_time.getTime();
    }
};

function start_notification() {
    timeit.activity_num++;
    var activity_num = timeit.activity_num;
    var notify = function() {
        if (!timeit.current_activity || activity_num != timeit.activity_num) {
            return;
        }

        if (timeit.notifications) {
            var popup = window.webkitNotifications.createNotification('', 'TimeIt', timeit.current_activity);
            popup.show();
            setTimeout(function() {
                popup.cancel();
            }, 2000);
        }

        setTimeout(notify, timeit.notification_interval);
    }
    setTimeout(notify, timeit.notification_interval);
}

function set_activity(name, tags) {
    $.getJSON('set-activity', {
        name: name,
        tags: tags
    }, function(data) {
        $('#current_activity_name').text(name);
        timeit.current_activity = name;
        timeit.start_time = new Date();
        update_timer();
        start_notification();
    });
}

function stop_activity() {
    $.getJSON('stop-activity', function(data) {
        $('#current_activity_name').text('No activity');
        timeit.current_activity = null;
        timeit.start_time = null;
    });
}

function TimeDelta(from, to) {
    if (to !== undefined) {
        this.total_ms = to.getTime() - from.getTime();
    } else {
        this.total_ms = from;
    }
}

TimeDelta.prototype.totalMs = function() {
    return this.total_ms;
}

TimeDelta.prototype.components = function() {
    var total_ms = this.total_ms;

    var hours = Math.floor(total_ms / (1000 * 60 * 60));
    total_ms -= hours * (1000 * 60 * 60);
    var minutes = Math.floor(total_ms / (1000 * 60));
    total_ms -= minutes * (1000 * 60);
    var seconds = Math.floor(total_ms / 1000);
    var ms = total_ms - (seconds * 1000);

    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        ms: ms
    };
}

TimeDelta.prototype.format = function(format) {
    var total_ms = this.total_ms;
    var str = format;

    if (str.search('%d') != -1) {
        var days = Math.floor(total_ms / (1000 * 60 * 60 * 24));
        total_ms %= 1000 * 60 * 60 * 24;
        str = str.replace('%d', days);
    }
    if (str.search('%H') != -1) {
        var hours = Math.floor(total_ms / (1000 * 60 * 60));
        total_ms %= 1000 * 60 * 60;
        str = str.replace('%H', hours);
    }
    if (str.search('%M') != -1 || str.search('%0M') != -1) {
        var minutes = Math.floor(total_ms / (1000 * 60));
        total_ms %= 1000 * 60;
        str = str.replace('%M', minutes);
        str = str.replace('%0M', ('0'+minutes).slice(-2));
    }
    if (str.search('%S') != -1 || str.search('%0S') != -1) {
        var seconds = Math.floor(total_ms / 1000);
        total_ms %= 1000;
        str = str.replace('%S', seconds);
        str = str.replace('%0S', ('0'+seconds).slice(-2));
    }
    if (str.search('%.') != -1 || str.search('%0.') != -1) {
        var ms = total_ms;
        total_ms = 0;
        str = str.replace('%.', ms);
        str = str.replace('%0.', ('00'+ms).slice(-3));
    }

    return [str, total_ms];
}

TimeDelta.prototype.toShortString = function() {
    var c = this.components();
    if (c.hours != 0) {
        return c.hours+' hours';
    }
    if (c.minutes != 0) {
        return c.minutes+' mins';
    }
    return c.seconds+' secs';
}

Date.prototype.format = function(format) {
    var total_ms = this.total_ms;
    var str = format;

    str = str.replace('%d', ('0'+this.getDate()).slice(-2));
    str = str.replace('%e', this.getDate());
    str = str.replace('%m', ('0'+(this.getMonth()+1)).slice(-2));
    str = str.replace('%Y', this.getFullYear());
    str = str.replace('%H', ('0'+this.getHours()).slice(-2));
    str = str.replace('%I', ('0'+(this.getHours() % 12)).slice(-2));
    str = str.replace('%M', ('0'+this.getMinutes()).slice(-2));
    str = str.replace('%S', ('0'+this.getSeconds()).slice(-2));

    return str;
}

function update_timer() {
    if (timeit.start_time) {
        var total_ms = timeit.time_elapsed_ms();
        $('#timer').text(new TimeDelta(total_ms).format('%H:%0M:%0S')[0]);
        setTimeout(update_timer, 1000);
    }
}

function format_difference(start, end) {
    end.getTime() - start.getTime();
}

function enableControls() {
    $('#current_activity').click(function() {
        $('#activity_form').show();

        $('#today_activities tr:not(.row-template)').remove();
        $.getJSON('today', function(data) {
            var $table = $('#today_activities');
            var $tpl = $table.find('tr.row-template');
            $.each(data, function(idx, activity) {
                var $row = $tpl.clone();
                $row.removeClass('row-template');
                var start = new Date(activity.start_time);
                var end = new Date(activity.end_time);
                var time = start.format('%H:%M')+' - '+end.format('%H:%M')
                $row.children('.time').text(time);
                $row.children('.activity').text(activity.name);
                if (activity.tags) {
                    $row.children('.tags').text(activity.tags.join(', '));
                }
                $row.children('.duration').text(new TimeDelta(start, end).toShortString());
                $row.appendTo($table);
            });
        });
    });

    $('#activity_form_button').click(function() {
        var name = $('#activity_form_name').val();
        var tags = $('#activity_form_tags').val();
        set_activity(name, tags);
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

    $('#add_earlier_activity').click(function(e) {
        e.preventDefault();
    });

    $('#show_overview').click(function(e) {
        e.preventDefault();
    });

    $('#today_activities tr').live('click', function(e) {
        $('#today_activities tr').removeClass('selected');
        $(this).addClass('selected');
        e.preventDefault();
    });

    $('#today_activities tr').live('dblclick', function(e) {
        var name = $(this).find('.activity').text();
        var tags = $(this).find('.tags').text();
        set_activity(name, tags);
        $('#activity_form').hide();
        e.preventDefault();
    });

    $('#today_activities').mouseout(function() {
        $('#today_activities tr').removeClass('selected');
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
            start_notification();
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
