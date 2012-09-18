window.timeit = (function() {
    window.__ = i18n.__;
    window.__n = i18n.__n;

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
        _.extTemplate.loader = timeit.loadTemplate;
        _.extTemplate.extensions.push(function (context) {
            context.__ = __,
            context.__n = __n
        });

        async.parallel([
            function (callback) {
                $.get('csrf-token').done(function(token) {
                    timeit.csrfToken = token;
                    callback();
                });
            },
            function (callback) {
                timeit.get('language').ok(function (language) {
                    var opts = {
                        language: language,
                        localesPath: 'locales'
                    };
                    if (timeit.debug) {
                        opts.missingCallback = function (singular, plural, number) {
                            timeit.get('translate', {
                                singular: singular,
                                plural: plural,
                                count: 0
                            });
                        };
                    }
                    i18n.init(opts, callback);
                    moment.lang(language);
                });
            }
        ], callback);
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

    timeit.updateCurrent = function() {
        timeit.trigger('activityChanging');
        timeit.initActivity();
    };

    timeit.activity = function(activity) {
        if (typeof activity === 'object') {
            return timeit.post('activity', activity);
        } else {
            var result = timeit.get('activity', {
                id: activity
            }).err(function (reason) {
                alert(reason);
            });
            var oldOk = result.ok;
            result.ok = function(callback) {
                oldOk.call(result, function(a) {
                    a.start_time = moment(a.start_time);
                    a.end_time = moment(a.end_time);
                    callback(a);
                });
            };
            return result;
        }
    };

    timeit.currentActivity = function(activity) {
        if (activity === undefined) {
            return currentActivity;
        } else {
            timeit.trigger('activityChanging');

            var req;
            if (activity) {
                req = timeit.post('current', {
                    name: activity.name,
                    tags: activity.tags
                });
            } else {
                req = timeit.post('current/stop');
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
        document.title = __('Working...')+' — TimeIt';
    });

    timeit.on('activityChanged', function() {
        var activity = timeit.currentActivity();
        if (activity) {
            document.title = activity.name + ' — TimeIt';
        } else {
            document.title = __('No activity')+' — TimeIt';
        }

        restartNotifications();
    });

    function restartNotifications () {
        if (notificationIntervalId) {
            clearInterval(notificationIntervalId);
        }

        function notify() {
            if (timeit.notificationsEnabled()) {
                var activity = timeit.currentActivity();
                var text = activity ? activity.name : __('No activity');
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
            function emit() {
                timeit.trigger('notificationsSwitched');
            }

            emit();
            window.webkitNotifications.requestPermission(emit);

        }
    };

    timeit.timeElapsedMs = function() {
        return new Date().getTime() - timeit.currentActivity().start_time.getTime();
    };

    timeit.notificationsEnabled = function() {
        return timeit.notificationsRequested
            && window.webkitNotifications.checkPermission() == 0;
    };

    timeit.fetchMessages = function() {
        timeit.get('messages').ok(function (messages) {
            var $container = $('#messages');
            _.each(messages, function (message) {
                $container.append(new timeit.AlertView(message).render().el);
            });
        });
    };

    timeit.redirect = function (path) {
        currentActivity = null;
        location.href = path;
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
                timeit.redirect('.');
            } else {
                var msg = __('Request failed')+' ('+xhr.status;
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
