window.timeit = {
    current_activity: null,
    start_time: null,
    notifications_requested: false,
    notificationInterval: 10 * 60 * 1000,
    notificationIntervalId: null,
    csrfToken: null,
    time_elapsed_ms: function() {
        return new Date().getTime() - timeit.start_time.getTime();
    },
    notifications_allowed: function() {
        return timeit.notifications_requested
            && window.webkitNotifications.checkPermission() == 0;
    }
};

$(document).ajaxSend(function(event, xhr, settings) {
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
        xhr.setRequestHeader("X-CSRF-Token", timeit.csrfToken);
    }
});

function restartNotification() {
    if (timeit.notificationIntervalId) {
        clearInterval(timeit.notificationIntervalId);
    }

    function notify() {
        if (!timeit.current_activity) {
            clearInterval(timeit.notificationIntervalId);
            timeit.notificationIntervalId = null;
            return;
        }

        if (timeit.notifications_allowed()) {
            var popup = window.webkitNotifications.createNotification('', 'TimeIt', timeit.current_activity);
            popup.show();
            setTimeout(function() {
                popup.cancel();
            }, 2000);
        }
    }

    timeit.notificationIntervalId = setInterval(notify, timeit.notificationInterval);
}

function set_activity(name, tags) {
    $.post('activity', {
        name: name,
        tags: tags
    }).done(function(data) {
        $('#current_activity_name').text(name);
        document.title = name + ' — TimeIt';
        $('#activity_supporting_text').text('');
        timeit.current_activity = name;
        timeit.start_time = new Date();
        updateTimer();
        restartNotification();
    });
}

function stop_activity() {
    $('#set_activity_form').modal('hide');
    $('#current_activity_name').html('LOADER');
    document.title = 'Working... — TimeIt';
    $('#activity_supporting_text').text('');

    $.post('activity/stop').done(function(data) {
        $('#current_activity_name').text('No activity');
        document.title = 'No activity — TimeIt';
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

function updateTimer() {
    if (timeit.start_time) {
        var favicon = $('link[rel="shortcut icon"]').attr('href');
        if (favicon == 'ico/empty.ico') {
            $.favicon('ico/favicon.ico');
        } else {
            $.favicon('ico/empty.ico');
        }

        var total_ms = timeit.time_elapsed_ms();
        $('#timer').text(new TimeDelta(total_ms).format('%H:%0M:%0S')[0]);
    } else {
        $.favicon('ico/favicon.ico');
    }
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

    $('#set_activity_form').on('shown', function() {
        $('#today_activities tr:not(.row-template)').remove();
        $('#set_activity_form_name').val('');
        $('#set_activity_form_tags').val('');
        $('#set_activity_form_name').focus();

        $.get('today').done(function(data) {
            var $table = $('#today_activities');
            var $tpl = $table.find('tr.row-template');
            $.each(data, function(idx, activity) {
                var $row = $tpl.clone();
                $row.removeClass('row-template');
                var start = new Date(activity.start_time);
                var end = new Date(activity.end_time);
                if (sameDay(start, end)) {
                    $row.children('.start_time').text(start.format('%H:%M'));
                }
                $row.children('.end_time').text(end.format('%H:%M'));
                $row.children('.activity').text(activity.name);
                if (activity.tags) {
                    $row.children('.tags').text(activity.tags.join(', '));
                }
                $row.children('.duration').text(new TimeDelta(start, end).toShortString());
                $row.appendTo($table);
            });
        });
    });

    $('#set_activity_form form').on('submit', function(e) {
        var name = $('#set_activity_form_name').val();
        var tags = $('#set_activity_form_tags').val();
        set_activity(name, tags);
        $('#set_activity_form').modal('hide');
        e.preventDefault();
    });

    $('#set_activity_form form input[type="text"]').on('keypress', function(e) {
        if (e.which == 13) {
            $('#set_activity_form form').submit();
        }
    });

    $('#set_activity_form_ok').click(function() {
        $('#set_activity_form form').submit();
    });

    $('#stop_activity').click(stop_activity);

    $('#add_earlier_activity').click(function() {
        $('#add_earlier_activity_form').modal('toggle');
    });

    $('#add_earlier_activity_form').on('shown', function() {
        $('#add_earlier_activity_form_name').focus();
        var today = new Date().format('%d.%m.%Y');
        $('#add_earlier_activity_form_start_date').val(today);
        $('#add_earlier_activity_form_end_date').val(today);
        $('#add_earlier_activity_form_start_date').datepicker({
            format: 'dd.mm.yyyy',
            weekStart: 1
        });
        $('#add_earlier_activity_form_end_date').datepicker({
            format: 'dd.mm.yyyy',
            weekStart: 1
        });
    });

    $('#add_earlier_activity_form form').on('submit', function(e) {
        e.preventDefault();
        var name = $('#add_earlier_activity_form_name').val();
        var tags = $('#add_earlier_activity_form_tags').val();
        var start_date = $('#add_earlier_activity_form_start_date').val();
        var end_date = $('#add_earlier_activity_form_end_date').val();
        var start_time = $('#add_earlier_activity_form_start_time').val();
        var end_time = $('#add_earlier_activity_form_end_time').val();

        function date_from_strings(date, time) {
            var date_parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(date);
            if (!date_parts || date_parts.length != 4) {
                return null;
            }

            var time_parts = /^(\d+):(\d\d)$/.exec(time);
            if (!time_parts || time_parts.length != 3) {
                return null;
            }

            return new Date(date_parts[3], date_parts[2], date_parts[1], time_parts[1], time_parts[2]);
        }

        var start = date_from_strings(start_date, start_time);
        var end = date_from_strings(end_date, end_time);
        if (!start || !end) {
            return;
        }

        $.post('activity/add-earlier', {
            name: name,
            tags: tags,
            start_time: start,
            end_time: end
        });

        $('#add_earlier_activity_form').modal('hide');
    });

    $('#add_earlier_activity_form form input[type="text"]').on('keypress', function(e) {
        if (e.which == 13) {
            $('#add_earlier_activity_form form').submit();
        }
    });

    $('#add_earlier_activity_form_ok').click(function() {
        $('#add_earlier_activity_form form').submit();
    });

    $('#show_overview').click(function() {
    });

    $('#today_activities tr').live('click', function() {
        var name = $(this).find('.activity').text();
        var tags = $(this).find('.tags').text();
        $('#set_activity_form_name').val(name);
        $('#set_activity_form_tags').val(tags);
    });

    $('#today_activities tr').live('dblclick', function() {
        var name = $(this).find('.activity').text();
        var tags = $(this).find('.tags').text();
        set_activity(name, tags);
        $('#set_activity_form').modal('hide');
    });

    $('#toggle_notify').click(function() {
        setNotifications(!$(this).hasClass('active'));
    });
}

function show_tracker() {
    $('#login_form').hide();
    $('#username_form').hide();
    $('#tracker').show();
    $('#login_widget').show();

    setInterval(updateTimer, 1000);

    $.get('activity').done(function(data) {
        if (data.length) {
            var activity = data[0];

            $('#current_activity_name').text(activity.name);
            document.title = activity.name + ' — TimeIt';
            $('#activity_supporting_text').text('');
            timeit.current_activity = activity.name;
            timeit.start_time = new Date(activity.start_time);
            updateTimer();
            restartNotification();
        } else {
            $('#current_activity_name').text('No activity');
            document.title = 'No activity — TimeIt';
            $('#activity_supporting_text').text('Click here to set activity');
        }

        enableControls();
    });
}

function setNotifications(requested, dontUpdateSettings) {
    timeit.notifications_requested = requested;

    if (!dontUpdateSettings) {
        $.post('settings', {notifications: requested ? 1 : 0});
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

function logged_in() {
    $.get('settings').done(function(settings) {
        if (settings.username) {
            $('#username').text(settings.username);
            show_tracker();
            if (settings.notifications || settings.notifications === undefined) {
                setNotifications(true, settings.notifications);
            } else {
                setNotifications(false);
            }
        } else {
            $('#username_form').show();

            var $username = $('#username_form input[name="username"]');
            $username.focus();
            $username.on('keypress', function() {
                $(this).parents('.control-group').removeClass('error');
            });

            $('#username_form form').on('submit', function(e) {
                var username = $username.val();
                if (!username) {
                    $username.parents('.control-group').addClass('error');
                } else {
                    $.post('settings', { username: username }).done(function(data) {
                        $('#username').text(username);
                        show_tracker();
                        setNotifications(true);
                    });
                }

                e.preventDefault();
            });
        }
    });
}

function startup() {
    $.get('auth/status').done(function(data) {
        if (data['logged_in']) {
            logged_in();
        } else {
            $('#login_form').show();
            $('#login_form input[name="openid"]').focus();
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
