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

$(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRF-Token", getCookie('_csrf'));
    }
});

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
    $.post('set-activity', {
        name: name,
        tags: tags
    }).done(function(data) {
        $('#current_activity_name').text(name);
        $('#activity_supporting_text').text('');
        timeit.current_activity = name;
        timeit.start_time = new Date();
        update_timer();
        start_notification();
    });
}

function stop_activity() {
    $('#set_activity_form').modal('hide');
    $('#current_activity_name').html('LOADER');
    $('#activity_supporting_text').text('');

    $.post('stop-activity').done(function(data) {
        $('#current_activity_name').text('No activity');
        $('#timer').text('');
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
    function sameDay(date1, date2) {
        return date1.getDate() == date2.getDate()
            && date1.getMonth() == date2.getMonth()
            && date1.getFullYear() == date2.getFullYear();
    }

    $('#current_activity').click(function() {
        $('#set_activity_form').modal('toggle');
    });

    $('#set_activity_form').on('show', function() {
        $('#today_activities tr:not(.row-template)').remove();
        $.get('today').done(function(data) {
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

    $('#set_activity_form_ok').click(function() {
        var name = $('#activity_form_name').val();
        var tags = $('#activity_form_tags').val();
        set_activity(name, tags);
        $('#set_activity_form').modal('hide');
    });

    $('#stop_activity').click(stop_activity);

    $('#add_earlier_activity').click(function(e) {
        e.preventDefault();
    });

    $('#show_overview').click(function(e) {
        e.preventDefault();
    });

    $('#today_activities tr').live('dblclick', function(e) {
        var name = $(this).find('.activity').text();
        var tags = $(this).find('.tags').text();
        set_activity(name, tags);
        $('#set_activity_form').modal('hide');
        e.preventDefault();
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

    $.get('current-activity').done(function(data) {
        if (data.length) {
            var activity = data[0];

            $('#current_activity_name').text(activity.name);
            $('#activity_supporting_text').text('');
            timeit.current_activity = activity.name;
            timeit.start_time = new Date(activity.start_time);
            update_timer();
            start_notification();
        } else {
            $('#current_activity_name').text('No activity');
            $('#activity_supporting_text').text('Click here to set activity');
        }

        enableControls();
    });
}

$(function() {
    $('#set_activity_form').modal({show: false});

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

    $.get('login-status').done(function(data) {
        if (data['logged_in']) {
            logged_in();
        } else {
            $('.not_logged_in').show();
        }
    });
});
