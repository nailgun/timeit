window.timeit = (function() {
    var timeit = {
        notificationsRequested: false,
        notificationInterval: 10 * 60 * 1000,
        csrfToken: null,
        valid: false
    };
    _.extend(timeit, Backbone.Events);

    // === Private ===
    var currentActivity = null;
    var notificationIntervalId = null;
    // ===============

    timeit.init = function(callback) {
        _.extTemplateLoader = timeit.loadTemplate;

        $.get('csrf-token').done(function(token) {
            timeit.csrfToken = token;
            callback();
        });
    };

    timeit.initActivity = function() {
        timeit.get('activity').ok(function(activity) {
            currentActivity = activity;
            if (activity) {
                activity.start_time = new Date(currentActivity.start_time);
            }
            timeit.valid = true;
            timeit.trigger('activityChanged');
        });
    };

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
                timeit.valid = true;
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
