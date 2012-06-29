var decors = require('./decors');
var loginRequired = decors.loginRequiredAjax;
var noErr = require('../utils').noErr;
var jsonDumpFormErrors = require('../utils').jsonDumpFormErrors;
var _ = require('underscore');
var forms2 = require('forms2');
var db = require('../db');

function parseTags(tagsString) {
    var tags = tagsString.split(/\s*,\s*/);
    return _.uniq(tags.sort());
}

// FIXME: respect user timezone
exports.today = loginRequired(function(req, res) {
    var end = new Date();
    end.setHours(23);
    end.setMinutes(59);
    end.setSeconds(59);
    end.setMilliseconds(999);
    var start = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    db.Activity.find({
        userId: req.user._id,
        end_time: {$gte: start, $lte: end},
    }).select('name', 'start_time', 'end_time', 'tags')
      .sort('end_time', -1)
      .exec(noErr(function(docs) {
        res.okJson(docs);
    }));
});

var currentActivityForm = forms2.create({
    name: forms2.fields.String(),
    tags: forms2.fields.String({required: false}),
});

exports.setCurrent = loginRequired(function (req, res) {
    currentActivityForm.handle(req, {
        success: function(form) {
            var tags = parseTags(form.data.tags);
            db.Activity.update({
                account: req.user._id,
                end_time: null,
            }, {
                $set: {end_time: new Date()}
            }, {
                safe: true,
                multi: true
            }, noErr(function() {
                var activity = new db.Activity({
                    userId: req.user._id,
                    name: form.data.name,
                    tags: tags,
                    start_time: new Date(),
                    end_time: null
                });

                activity.save(noErr(function() {
                    res.okJson();
                }));
            }));
        },
        error: jsonDumpFormErrors(res)
    });
});

exports.edit = loginRequired(function (req, res) {
    var form = forms2.create({
        name: forms2.fields.String(),
        tags: forms2.fields.String({required: false}),
        start_time: forms2.fields.JSDateTime(),
        end_time: forms2.fields.JSDateTime({
            validators: [forms2.validators.Max(new Date())],
            errorMessages: {'max_value': 'date is in feature'}
        }),
        in_progress: forms2.fields.Boolean({
            validators: [function (value, callback) {
                if (!value) {
                    return callback();
                }

                db.Activity.findOne({
                    userId: req.user._id,
                    end_time: null
                }).select('name')
                  .exec(noErr(function(doc) {
                    if (doc) {
                        return callback({
                            message: 'activity '+doc.name+' already in progress'
                        });
                    } else {
                        return callback();
                    }
                }));
            }]
        })
    }, function validate(form, callback) {
        if (form.data.start_time > form.data.end_time) {
            return callback('start must be earlier then end', 'start_time');
        } else {
            return callback();
        }
    });

    form.handle(req, {
        success: function(form) {
            var tags = parseTags(form.data.tags);
            var isNew = !req.body._id;

            var queryEndTime;
            if (form.data.in_progress) {
                queryEndTime = new Date();
            } else {
                queryEndTime = form.data.end_time;
            }

            var query = { 
                userId: req.user._id,
                $or: [{
                    start_time: {$lt: form.data.start_time},
                    end_time: {$gt: form.data.start_time},
                }, {
                    start_time: {$lt: queryEndTime},
                    end_time: {$gt: queryEndTime},
                }, {
                    start_time: {$gte: form.data.start_time},
                    end_time: {$lte: queryEndTime},
                }]
            };

            if (!isNew) {
                query._id = {
                    $ne: req.body._id
                };
            }

            // check for intersection
            db.Activity.find(query, {
                userId: 0
            }).sort('end_time', 1).exec(noErr(function(docs) {
                if (docs.length) {
                    res.errJson({
                        reason: 'intersection',
                        with: docs
                    });
                } else {
                    var data = {
                        userId: req.user._id,
                        name: form.data.name,
                        tags: tags,
                        start_time: form.data.start_time,
                    };
                    if (form.data.in_progress) {
                        data.end_time = null;
                    } else {
                        data.end_time = form.data.end_time;
                    }

                    // insert/update
                    if (isNew) {
                        new db.Activity(data).save(noErr(function () {
                            res.okJson();
                        }));
                    } else {
                        db.Activity.update({
                            _id: req.body._id
                        }, {
                            $set: data
                        }, noErr(function() {
                            res.okJson();
                        }));
                    }
                }
            }));
        },
        error: function(form) {
            var report = {
                errors: form.errors,
                field_errors: form.field_errors,
            };
            res.errJson({
                reason: 'form',
                report: report
            });
        }
    });
});

exports.stop = loginRequired(function (req, res) {
    db.Activity.update({
        userId: req.user._id,
        end_time: null,
    }, {
        $set: {end_time: new Date()}
    }, {
        safe: true,
        multi: true
    }, noErr(function(docs) {
        res.okJson();
    }));
});

exports.get = loginRequired(function(req, res) {
    var query = {
        userId: req.user._id
    };
    if (req.query.id) {
        query._id = req.query.id;
    } else {
        query.end_time = null;
    }

    db.Activity.findOne(query, {
        userId: 0
    }, noErr(function(doc) {
        res.okJson(doc);
    }));
});

var fromToForm = forms2.create({
    from: forms2.fields.JSDateTime(),
    to: forms2.fields.JSDateTime(),
    search: forms2.fields.String({
        required: false
    })
}, function validate(form, callback) {
    if (form.data.from > form.data.to) {
        return callback('start must be earlier then end', 'from');
    } else {
        return callback();
    }
});

// FIXME: respect user timezone
exports.getLog = loginRequired(function(req, res) {
    fromToForm.handle(req, {
        success: function (form) {
            var query = {
                userId: req.user._id,
                start_time: {$lte: form.data.to},
                end_time: {$gte: form.data.from},
            };

            var searchTerms = '';
            if (form.data.search) {
                searchTerms = form.data.search.toLowerCase().split(/\s/);
                searchTerms = _.filter(searchTerms, function (term) {
                    return !!term;
                });
            }

            if (searchTerms) {
                var map = function () {
                    if (searchTerms.some(function (term) {
                        return this.name.toLowerCase().indexOf(term) != -1
                            || this.tags.some(function (tag) {
                                return tag.toLowerCase() == term;
                            }, this);
                    }, this)) {
                        emit(this._id, this);
                    }
                };

                var reduce = function (k, vals) {
                    return vals;
                };

                db.Activity.collection.mapReduce(map, reduce, {
                    out : {inline: 1},
                    query: query,
                    scope: {
                        searchTerms: searchTerms,
                    },
                }, noErr(function(results) {
                    res.okJson(_.map(results, function (result) {
                        return result.value;
                    }));
                }));
            } else {
                db.Activity
                  .find(query)
                  .select({userId: 0})
                  .sort('start_time', 1)
                  .exec(noErr(function(docs) {
                    res.okJson(docs);
                }));
            }
        },
        error: function (form) {
            var report = {
                errors: form.errors,
                field_errors: form.field_errors,
            };
            res.errJson(report);
        }
    });
});

exports.remove = loginRequired(function(req, res) {
    db.Activity.remove({
        userId: req.user._id,
        _id: req.body.id
    }, noErr(function() {
        res.okJson();
    }));
});

exports.getStats = loginRequired(function(req, res) {
    var types = {
        ACTIVITY: 'a',
        TAG: 't',
        META: 'm',
        WEEKDAY_TOTAL: 'w',
        WEEKDAY_START: 's',
        WEEKDAY_END: 'e',
    };
    var DAY = 24 * 60 * 60 * 1000;

    var map = function () {
        function emitWeekday(i1, i2) {
            var weekday = new Date(i1).getDay();
            emit(types.WEEKDAY_TOTAL + weekday, i2 - i1);
        }

        function sod(date) {
            date = new Date(date);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        }

        var startMs = this.start_time.getTime();
        var endMs = this.end_time.getTime();
        var i1 = startMs;
        var i2 = sod(new Date(i1 + DAY)).getTime()
        while (i2 < endMs) {
            emitWeekday(i1, i2);
            i1 = i2;
            i2 += DAY;
        }
        i2 = endMs;
        emitWeekday(i1, i2);

        var duration = this.end_time.getTime() - this.start_time.getTime();
        emit(types.ACTIVITY + this.name, duration);
        this.tags.forEach(function (tag) {
            emit(types.TAG + tag, duration);
        }, this);
        emit(types.META + 'total', duration);
        emit(types.META + 'longest', [duration, this]);
        emit(types.META + 'first', this);
        emit(types.META + 'count', 1);
    };

    var reduce = function (key, values) {
        if (key === types.META + 'longest') {
            var maxDuration = 0;
            var activity = null;
            values.forEach(function (value) {
                if (value[0] > maxDuration) {
                    maxDuration = value[0];
                    activity = value[1];
                }
            });
            return {
                duration: maxDuration,
                activity: activity
            };
        } else if (key === types.META + 'first') {
            var first = values[0];
            values.slice(1).forEach(function (activity) {
                if (activity.start_time < first.start_time) {
                    first = activity;
                }
            });
            return first;
        } else {
            var total = 0;
            values.forEach(function (value) {
                total += value;
            });
            return total;
        }
    };

    db.Activity.collection.mapReduce(map, reduce, {
        out : {
            inline: 1
        },
        query: {
            userId: req.user._id
        },
        scope: {
            types: types,
            DAY: DAY
        }
    }, noErr(function(results) {
        var report = {
            activity: {},
            tag: {},
            weekday: {},
            total: 0
        };

        for(var i = 0; i < 7; i++) {
            report.weekday[i] = 0;
        }

        _.each(results, function (entry) {
            var type = entry._id[0];
            var name = entry._id.slice(1);
            var value = entry.value;

            if (type === types.ACTIVITY) {
                report.activity[name] = value;
            } else if (type === types.TAG) {
                report.tag[name] = value;
            } else if (type === types.WEEKDAY_TOTAL) {
                report.weekday[name] = value;
            } else if (type === types.META) {
                report[name] = value;
            }
        });

        res.okJson(report);
    }));
});
