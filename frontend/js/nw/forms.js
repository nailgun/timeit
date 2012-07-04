(function () {

var exports = {}
if (typeof module !== 'undefined') {
    exports = module.exports;
} else {
    exports = nw.forms = {};
}

exports.create = function (fields, validate) {
    var form = {
        fields: fields,
        validate: validate
    };

    form.bind = function (data) {
        var bound = {};
        bound.validate = form.validate;
        bound.fields = {};
        Object.keys(form.fields).forEach(function (k) {
            bound.fields[k] = form.fields[k].bind(data[k]);
        });
        var isValid = undefined;

        bound.clean = function (callback) {
            bound.data = {};
            bound.field_errors = {};
            bound.errors = [];

            async.forEach(Object.keys(bound.fields), function (k, callback) {
                bound.fields[k].clean(function(errs, value) {
                    if (!errs) {
                        bound.data[k] = value;
                    } else {
                        bound.field_errors[k] = [];
                        errs.forEach(function(err) {
                            bound.field_errors[k].push(err.message);
                        });
                    }
                    callback();
                });

            }, function () {
                isValid = !Object.keys(bound.field_errors).length;
                if (isValid && bound.validate) {
                    bound.validate(bound, function(err, field) {
                        if (err) {
                            if (field) {
                                if (!bound.field_errors[field]) {
                                    bound.field_errors[field] = [err];
                                } else {
                                    bound.field_errors[field].push(err);
                                }
                            } else {
                                bound.errors.push(err);
                            }
                            isValid = false;
                        }
                        callback();
                    });
                } else {
                    callback();
                }
            });
        };

        bound.isValid = function () {
            return isValid;
        };

        return bound;
    };

    form.handle = function (obj, callback) {
        var bound = form.bind(obj);
        bound.clean(function () {
            callback(bound);
        });
    };

    return form;
};

})();
