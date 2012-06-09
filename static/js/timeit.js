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

    timeit.utils = {};

    timeit.utils.capitalize = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    timeit.utils.setFormErrors = function ($form, report) {
        $form.find('.error-help').remove();
        $form.find('.control-group').removeClass('error');
        for (var fieldName in report.field_errors) {
            var field_errors = report.field_errors[fieldName];
            var msg = timeit.utils.capitalize(field_errors.join(', ')) + '.';
            var $control = $form.find('[name="'+fieldName+'"]');
            $control.parents('.control-group').addClass('error');
            $control.after($('<p class="help-block error-help">'+msg+'</p>'));
        }
    };

    timeit.utils.TimeDelta = function (from, to) {
        if (to !== undefined) {
            this.total_ms = to.getTime() - from.getTime();
        } else {
            this.total_ms = from;
        }
    };

    timeit.utils.TimeDelta.prototype.totalMs = function() {
        return this.total_ms;
    };

    timeit.utils.TimeDelta.prototype.components = function() {
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
    };

    timeit.utils.TimeDelta.prototype.format = function(format) {
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
    };

    timeit.utils.TimeDelta.prototype.toShortString = function() {
        var c = this.components();
        if (c.hours != 0) {
            return c.hours+' hours';
        }
        if (c.minutes != 0) {
            return c.minutes+' mins';
        }
        return c.seconds+' secs';
    };

    timeit.utils.formatDate = function(date, format) {
        var total_ms = date.total_ms;
        var str = format;

        str = str.replace('%d', ('0'+date.getDate()).slice(-2));
        str = str.replace('%e', date.getDate());
        str = str.replace('%m', ('0'+(date.getMonth()+1)).slice(-2));
        str = str.replace('%Y', date.getFullYear());
        str = str.replace('%H', ('0'+date.getHours()).slice(-2));
        str = str.replace('%I', ('0'+(date.getHours() % 12)).slice(-2));
        str = str.replace('%M', ('0'+date.getMinutes()).slice(-2));
        str = str.replace('%S', ('0'+date.getSeconds()).slice(-2));

        return str;
    };

    timeit.utils.sameDay = function (date1, date2) {
        return date1.getDate() == date2.getDate()
            && date1.getMonth() == date2.getMonth()
            && date1.getFullYear() == date2.getFullYear();
    };

    timeit.utils.TemplateMixin = {
        render: function () {
            var view = this;
            var args = arguments;
            $.get('views/'+this.template+'.html', function(html) {
                view.$el.html(html);
                if (view.rendered !== undefined) {
                    view.rendered.apply(view, args);
                }
            });
            return this;
        }
    };

    timeit.utils.ModalMixin = {
        className: 'modal',

        events: {
            'hidden': function() {
                this.remove();
            }
        },

        show: function() {
            this.render.apply(this, arguments).$el.modal();
        }
    };

    timeit.utils.ClearErrorMixin = {
        events: {
            'keypress input[type="text"]': 'cleanError',
            'change input': 'cleanError'
        },

        cleanError: function(e) {
            $(e.currentTarget).removeClass('error');
            $(e.currentTarget).parents().removeClass('error');
        }
    };

    timeit.utils.View = Backbone.View.extend({});
    timeit.utils.View.extend = function () {
        var child = Backbone.View.extend.apply(this, arguments);
        child.mixin = function (mixin) {
            mixinView(child, mixin);
            return child;
        };
        return child;
    };
    
    function mixinView (viewClass, mixin) {
        function extend(dst, src) {
            for (var k in src) {
                if (src.hasOwnProperty(k) && !dst.hasOwnProperty(k)) {
                    dst[k] = src[k];
                }
            }
        }
        var viewProto = viewClass.prototype;
        if (typeof mixin.events == 'object') {
            if (typeof viewProto.events === 'undefined') {
                viewProto.events = {};
            }
            if (typeof viewProto.events === 'object') {
                extend(viewProto.events, mixin.events);
            }
        }
        if (typeof mixin.className == 'string' && typeof viewProto.className == 'string') {
            viewProto.className += ' '+mixin.className;
        }
        extend(viewProto, mixin);
    }

    timeit.utils.formData = function($form, data) {
        if (data === undefined) {
            var values = {};
            $.each($form.serializeArray(), function(i, field) {
                values[field.name] = field.value;
            });
            return values;
        } else {
            $.each(data, function(name, value) {
                $form.find('input[name="'+name+'"]').val(value);
            });
        }
    };

    return timeit;
})();

$(function() {
    timeit.start();
});
