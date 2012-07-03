var decors = require('./decors');
var loginRequired = decors.loginRequiredAjax;
var noErr = require('../utils').noErr;
var jsonDumpFormErrors = require('../utils').jsonDumpFormErrors;
var _ = require('underscore');
var forms2 = require('forms2');
var db = require('../db');
var i18n = require('i18n');
var __ = i18n.__,
    __n = i18n.__n;

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
                userId: req.user._id,
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
            errorMessages: {'max_value': __('date is in feature')}
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
                            message: __('activity %s already in progress', doc.name)
                        });
                    } else {
                        return callback();
                    }
                }));
            }]
        })
    }, function validate(form, callback) {
        if (form.data.start_time > form.data.end_time) {
            return callback(__('start must be earlier then end'), 'start_time');
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
        return callback(__('start must be earlier then end'), 'from');
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
        ACTIVITY_START: 'b',
        ACTIVITY_END: 'c',
        TAG: 't',
        TAG_START: 'u',
        TAG_END: 'v',
        WEEKDAY: 'w',
        WEEKDAY_START: 'x',
        WEEKDAY_END: 'y',
        META: 'm',
    };
    var DAY = 24 * 60 * 60 * 1000;

    var map = function () {
        if (!this.end_time) {
            return;
        }

        function emitWeekday(i1, i2) {
            var weekday = new Date(i1).getDay();
            emit(types.WEEKDAY + weekday, i2 - i1);

            emit(types.WEEKDAY_START + weekday, dayTime(new Date(i1)));
            emit(types.WEEKDAY_END + weekday, dayTime(new Date(i2-1)));
        }

        function sod(date) {
            date = new Date(date);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        }

        function dayTime(date) {
            return date.getTime() - sod(date).getTime();
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
        var startDayTime = dayTime(this.start_time);
        var endDayTime = dayTime(this.end_time);
        emit(types.ACTIVITY_START + this.name, startDayTime);
        emit(types.ACTIVITY_END + this.name, endDayTime);

        this.tags.forEach(function (tag) {
            emit(types.TAG + tag, duration);
            emit(types.TAG_START + tag, startDayTime);
            emit(types.TAG_END + tag, endDayTime);
        }, this);
        emit(types.META + 'total', duration);
        emit(types.META + 'longest', [duration, this]);
        emit(types.META + 'first', this);
        emit(types.META + 'count', 1);
    };

    var reduce = function (key, values) {
        if (key[0] === types.ACTIVITY_START || key[0] === types.TAG_START || key[0] === types.WEEKDAY_START) {
            var min = DAY;
            values.forEach(function (value) {
                min = Math.min(value, min);
            });
            return min;
        } else if (key[0] === types.ACTIVITY_END || key[0] === types.TAG_END || key[0] === types.WEEKDAY_END) {
            var max = 0;
            values.forEach(function (value) {
                max = Math.max(value, max);
            });
            return max;
        } else if (key === types.META + 'longest') {
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
            activity_start: {},
            activity_end: {},
            tag_start: {},
            tag_end: {},
            weekday_start: {},
            weekday_end: {},
            total: 0
        };

        for(var i = 0; i < 7; i++) {
            report.weekday[i] = 0;
        }

        var containerMap = cm = {}
        cm[types.ACTIVITY] = report.activity;
        cm[types.TAG] = report.tag;
        cm[types.WEEKDAY] = report.weekday;
        cm[types.ACTIVITY_START] = report.activity_start;
        cm[types.ACTIVITY_END] = report.activity_end;
        cm[types.TAG_START] = report.tag_start;
        cm[types.TAG_END] = report.tag_end;
        cm[types.WEEKDAY_START] = report.weekday_start;
        cm[types.WEEKDAY_END] = report.weekday_end;
        cm[types.META] = report;

        _.each(results, function (entry) {
            var type = entry._id[0];
            var name = entry._id.slice(1);
            var value = entry.value;

            container = containerMap[type];
            if (container) {
                container[name] = value;
            }
        });

        res.okJson(report);
    }));
});

exports.getGroups = loginRequired(function (req, res) {
    db.Activity.collection.group([
        'name', 'tags'
    ], {
        userId: req.user._id
    }, {
        count: 0
    }, function (obj, prev) {
        prev.count++;
    }, noErr(function (groups) {
        res.okJson(groups);
    }));
});

var updateGroupForm = forms2.create({
    oldName: forms2.fields.String(),
    oldTags: forms2.fields.String({required: false}),
    newName: forms2.fields.String(),
    newTags: forms2.fields.String({required: false}),
});

exports.updateGroup = loginRequired(function (req, res) {
    updateGroupForm.handle(req, {
        success: function(form) {
            var oldTags = parseTags(form.data.oldTags);
            var newTags = parseTags(form.data.newTags);

            db.Activity.update({
                userId: req.user._id,
                name: form.data.oldName,
                tags: oldTags,
            }, {
                $set: {
                    name: form.data.newName,
                    tags: newTags,
                }
            }, {
                safe: true,
                multi: true
            }, noErr(function(result) {
                console.log(result);
                res.okJson();
            }));
        },
        error: jsonDumpFormErrors(res)
    });
});
