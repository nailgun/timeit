window.timeit = (function() {
    var timeit = {
        notificationsRequested: false,
        notificationInterval: 10 * 60 * 1000,
        csrfToken: null
    };
    _.extend(timeit, Backbone.Events);

    // === Private ===
    var currentActivity = null;
    var notificationIntervalId = null;
    // ===============

    timeit.start = function() {
        delete timeit.start;

        $(window).on('beforeunload', function() {
            if (timeit.currentActivity()) {
                return "Keeping activity on the go!";
            }
        });

        $.get('csrf-token').done(function(token) {
            timeit.csrfToken = token;
            init1();
        });
    }

    function init1 () {
        timeit.get('version').ok(function(version) {
            $('#version').text(version);
        });

        timeit.get('auth/status').ok(function(isLoggedIn) {
            if (isLoggedIn) {
                init2();
            } else {
                $('#control').html(new timeit.LoginView().render().el);
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
        $('#username').text(settings.username);
        $('#login_widget').show();

        var tracker = new timeit.TrackerView();
        $('#control').html(tracker.render().el);

        tracker.on('click', function() {
            new timeit.SetActivityForm().show();
        });
        tracker.on('addEarlier', function() {
            new timeit.EarlierActivityForm().show();
        });

        timeit.get('activity').ok(function(activity) {
            currentActivity = activity;
            if (activity) {
                currentActivity.start_time = new Date(currentActivity.start_time);
            }
            timeit.trigger('activityChanged');
        });

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

    timeit.currentActivity = function(activity) {
        if (activity === undefined) {
            return currentActivity;
        } else {
            timeit.trigger('activityChanging');

            var req;
            if (activity) {
                req = timeit.post('activity', {
                    name: activity.name,
                    tags: activity.tags
                });
            } else {
                req = timeit.post('activity/stop');
            }

            return req.ok(function() {
                currentActivity = activity;
                if (activity) {
                    activity.start_time = new Date();
                }
                timeit.trigger('activityChanged');
            }).err(function() {
                timeit.trigger('activityChanged');
            });
        }
    };

    timeit.on('activityChanging', function() {
        document.title = 'Working... — TimeIt';
    });

    timeit.on('activityChanged', function() {
        var activity = timeit.currentActivity();
        if (activity) {
            document.title = activity.name + ' — TimeIt';
        } else {
            document.title = 'No activity — TimeIt';
        }

        restartNotifications();
    });

    function restartNotifications () {
        if (notificationIntervalId) {
            clearInterval(notificationIntervalId);
        }

        function notify() {
            if (timeit.notificationsAllowed()) {
                var activity = timeit.currentActivity();
                var text = activity ? activity.name : 'No activity';
                var popup = window.webkitNotifications.createNotification('', 'TimeIt', text);
                popup.show();
                setTimeout(function() {
                    popup.cancel();
                }, 2000);
            }
        }

        notificationIntervalId = setInterval(notify, timeit.notificationInterval);
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

    timeit.setNotifications = function(requested, dontUpdateSettings) {
        timeit.notificationsRequested = requested;

        if (!dontUpdateSettings) {
            timeit.post('settings', {
                notifications: requested ? 1 : 0
            });
        }

        if (window.webkitNotifications) {
            function updateToggle() {
                if (timeit.notificationsAllowed()) {
                    $('#toggle_notify').addClass('active');
                } else {
                    $('#toggle_notify').removeClass('active');
                }
            }

            updateToggle();
            window.webkitNotifications.requestPermission(updateToggle);

        } else {
            $('#toggle_notify').remove();
        }
    };

    timeit.timeElapsedMs = function() {
        return new Date().getTime() - timeit.currentActivity().start_time.getTime();
    };

    timeit.notificationsAllowed = function() {
        return timeit.notificationsRequested
            && window.webkitNotifications.checkPermission() == 0;
    };

    timeit.post = function(url, data) {
        return timeit.rpc('POST', url, data, {
            headers: {
                'X-CSRF-Token': timeit.csrfToken
            }
        });
    };

    timeit.get = function(url, data) {
        return timeit.rpc('GET', url, data);
    };

    timeit.rpc = function(method, url, data, opts) {
        var fullOpts = {
            type: method,
            data: data,
            dataType: 'json',
        };
        $.extend(fullOpts, opts || {});

        var xhr = $.ajax(url, fullOpts).fail(function(xhr) {
            if (xhr.status == 401) {
                timeit.current_activity = null;
                location.href = '.';
            } else {
                var msg = 'Request failed ('+xhr.status;
                if (xhr.statusText) {
                    msg += ' '+xhr.statusText;
                }
                msg += ')'
                alert(msg);
            }
        });
        var callObj = {
            ok: function(callback) {
                xhr.done(function(data) {
                    if (data.status == 'ok') {
                        callback(data.body);
                    }
                });
                return callObj;
            },
            err: function(callback) {
                xhr.done(function(data) {
                    if (data.status == 'err') {
                        callback(data.body);
                    }
                });
                return callObj;
            }
        };
        return callObj;
    };

    return timeit;
})();

$(function() {
    timeit.start();
});
