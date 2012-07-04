(function () {

var exports = {}
if (typeof module !== 'undefined') {
    exports = module.exports;
} else {
    exports = nw.forms;
}

function ValidationError(code, messageMap) {
    return {
        code: code,
        message: messageMap[code],
    };
}

exports.BaseField = function (opt) {
    opt = opt || {};
    var field = {
        required: true,
        validators: [],
        errorMessages: {
            'required': 'this field is required',
            'invalid': 'enter a valid value',
        }
    };

    if (opt.hasOwnProperty('required')) {
        field.required = opt.required;
    }

    if (opt.hasOwnProperty('validators')) {
        field.validators = opt.validators;
    }

    if (opt.hasOwnProperty('errorMessages')) {
        for (var msgName in opt.errorMessages) {
            if (opt.errorMessages.hasOwnProperty(msgName)) {
                field.errorMessages[msgName] = opt.errorMessages[msgName];
            }
        }
    }

    field.parse = function (raw_data, callback) {
        callback(null, raw_data);
    };

    field.validate = function (value, callback) {
        if ((value === '' || value === null || typeof value === 'undefined') && field.required) {
            callback(ValidationError('required', field.errorMessages));
        } else {
            callback(null);
        }
    };

    field.bind = function (raw_data) {
        var bound = {};
        _.extend(bound, field);

        bound.raw_data = raw_data;

        bound.clean = function(callback) {
            bound.parse(bound.raw_data, function(err, value) {
                if (err) {
                    callback([err]);
                    return;
                }

                bound.validate(value, function(err) {
                    if (err) {
                        callback([err]);
                        return;
                    }

                    var validatorErrors = [];
                    async.forEachSeries(bound.validators, function(validator, callback) {
                        validator(value, function(err) {
                            if (err) {
                                if ('code' in err && err.code in bound.errorMessages) {
                                    err.message = bound.errorMessages[err.code];
                                }
                                validatorErrors.push(err);
                            }
                            callback();
                        });
                    }, function() {
                        if (validatorErrors.length) {
                            callback(validatorErrors);
                        } else {
                            callback(null, value);
                        }
                    });
                });
            });
        };

        return bound;
    };

    return field;
};

exports.StringField = function (opt) {
    var field = exports.BaseField(opt);
    field.parse = function (raw_data, callback) {
        if (typeof raw_data !== 'undefined' && raw_data !== null) {
            callback(null, String(raw_data));
        } else {
            callback(null, '');
        }
    };
    return field;
};


exports.NumberField = function (opt) {
    var field = exports.BaseField(opt);
    field.parse = function (raw_data, callback) {
        var value = NaN;
        if (raw_data !== null || raw_data !== '') {
            value = Number(raw_data);
        }
        if (isNaN(value)) {
            callback(ValidationError('invalid', field.errorMessages));
        } else {
            callback(null, value);
        }
    };
    return field;
};

exports.BooleanField = function (opt) {
    var field = exports.BaseField(opt);
    field.parse = function (raw_data, callback) {
        callback(null, Boolean(raw_data));
    };
    return field;
};

exports.DateTimeField = function (opt) {
    var field = exports.BaseField(opt);
    field.parse = function (raw_data, callback) {
        var value = new Date(raw_data);
        if (isNaN(value)) {
            callback(ValidationError('invalid', field.errorMessages));
        } else {
            callback(null, value);
        }
    }
    return field;
}

})();
