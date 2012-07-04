(function ($) {

var methods = {};

function Form (opts, $form) {
    var form = opts;

    form.$ = $form;
    form.handler = nw.forms.create(form.fields, form.validate);

    form.data = function (data) {
        if (data === undefined) {
            var values = {};
            $.each(form.$.serializeArray(), function (i, field) {
                values[field.name] = field.value;
            });
            return values;
        } else {
            $.each(data, function (name, value) {
                form.$.find('[name="'+name+'"]').val(value);
            });
        }
    };

    form.setErrors = function (report) {
        form.$.find('.error-help').remove();
        form.$.find('.control-group').removeClass('error');

        $.each(report.fieldErrors, function (i, fieldName) {
            var fieldErrors = report.fieldErrors[fieldName];
            var msg = nw.utils.capitalize(fieldErrors.join(', ')) + '.';
            var $control = form.$.find('[name="'+fieldName+'"]');
            var $controlGroup = $control.parents('.control-group');
            var $controls = $controlGroup.find('.controls');
            $controlGroup.addClass('error');
            $controls.append($('<p class="help-block error-help">'+msg+'</p>'));
        });

        // TODO: non field errors
    };

    return form;
};

methods.init = function (opts) {
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
        $this.data(nwForm, form);

        $this.on('submit', function (e) {
            e.preventDefault();
            var data = form.data();

            function onFail (err) {
                $this.trigger('error', err);
                form.setErrors(err);
            }

            form.handler.handle().fail(onFail).done(function (bound) {
                function onDone (data) {
                    $this.trigger('submitted', data || bound.data);
                }

                if (typeof form.method === 'function') {
                    form.method.call($this, bound.data).fail(onFail)
                                                       .done(onDone);
                } else {
                    nw.rpc({
                        method: form.method,
                        url: form.url,
                        data: bound.data
                    }).fail(onFail)
                      .done(onDone);
                }
            });
        });

        $this.find('input[type="text"],textarea').on('keypress', clearError);
        $this.find('input,textarea').on('change', clearError);

        function clearError () {
            var $this = $(this);
            $this.removeClass('error');
            $this.parents().removeClass('error');
        }
    });
};

$.fn.nwForm = function (method) {
    if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
        return methods.init.apply(this, arguments);
    } else {
        $.error('Method '+method+' does not exist on jQuery.nwForm');
    }
};

})(jQuery);
