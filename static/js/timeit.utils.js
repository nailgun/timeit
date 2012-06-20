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
})();
