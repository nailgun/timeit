(function ($) {

var methods = {};

function Form (opts, $form) {
    var form = {};

    var validator = nw.forms.create(opts.fields, opts.validate);

    $form.on('submit', function (e) {
        e.preventDefault();
        var data = form.data();

        function onFail (errors) {
            $form.trigger('error', errors);
            form.setErrors(errors);
        }

        validator.handle(data, function (bound) {
            if (!bound.isValid()) {
                return onFail(bound.errors);
            }

            function onDone (data) {
                $form.trigger('submitted', data || bound.data);
            }

            if (typeof opts.method === 'function') {
                opts.method.call($form, bound.data).fail(onFail)
                                                   .done(onDone);
            } else {
                nw.rpc({
                    method: opts.method,
                    url: form.url,
                    data: bound.data
                }).fail(onFail)
                  .done(onDone);
            }
        });
    });

    $form.find('input[type="text"],textarea').on('keypress', clearError);
    $form.find('input,textarea').on('change', clearError);

    function clearError () {
        var $this = $(this);
        $this.removeClass('error');
        $this.parents().removeClass('error');
    }

    form.data = function (data) {
        if (data === undefined) {
            var values = {};
            $.each($form.serializeArray(), function (i, field) {
                values[field.name] = field.value;
            });
            return values;
        } else {
            $.each(data, function (name, value) {
                var $input = $form.find('[name="'+name+'"]');
                if ($input.is('[type="checkbox"]')) {
                    $input.attr('checked', !!value);
                } else if ($input.is('[type="radio"]')) {
                    $input = $input.filter('[value="'+value+'"]');
                    $input.attr('checked', !!value);
                } else {
                    $input.val(value);
                }
            });
            return $form;
        }
    };

    form.setErrors = function (errors) {
        $form.find('.error-help').remove();
        $form.find('.control-group').removeClass('error');

        $.each(errors, function (fieldName, fieldErrors) {
            //if (fieldName === '_nonField') {
            //    return;
            //}

            var msg = nw.utils.capitalize(fieldErrors.join(', ')) + '.';
            var $control = $form.find('[name="'+fieldName+'"]');
            var $controlGroup = $control.parents('.control-group');
            var $controls = $controlGroup.find('.controls');
            $controlGroup.addClass('error');
            $controls.append($('<p class="help-block error-help">'+msg+'</p>'));
        });

        // TODO: non field errors
        return $form;
    };

    return form;
};

var init = function (opts) {
    opts = $.extend({
        url: null,
        method: 'post',
        fields: {},
        validate: null
    }, opts);

    if (opts.url === null && typeof opts.method !== 'function') {
        return $.error('jQuery.nwForm: url must be set');
    }

    return this.each(function () {
        var $this = $(this),
            form = $this.data('nwForm');

        if (form) {
            return;
        }

        form = Form(opts, $this);
        $this.data('nwForm', form);
    });
};

$.fn.nwForm = function (method) {
    var form = this.data('nwForm');
    if (form) {
        return form[method].apply(form, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
        return init.apply(this, arguments);
    } else {
        $.error('Method '+method+' does not exist on jQuery.nwForm');
    }
};

})(jQuery);
