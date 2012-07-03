(function() {
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
            var $controlGroup = $control.parents('.control-group');
            var $controls = $controlGroup.find('.controls');
            $controlGroup.addClass('error');
            $controls.append($('<p class="help-block error-help">'+msg+'</p>'));
        }
    };

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

    timeit.utils.intervalProps = function (a, b) {
        var props = {};
        if (a.format('DDMMYYYY') === b.format('DDMMYYYY')) {
            props.sameDay = true;
            props.sameMonth = true;
            props.sameYear = true;
        } else if (a.format('MMYYYY') === b.format('MMYYYY')) {
            props.sameMonth = true;
            props.sameYear = true;
        } else if (a.year() === b.year()) {
            props.sameYear = true;
        }
        if (a.day() === 1 && b.day() === 0) {
            var diff = Math.abs(b.diff(a));
            if (diff < moment.duration(8, 'days') && diff > moment.duration(6, 'days')) {
                props.week = true;
            }
        }
        return props;
    };
})();
