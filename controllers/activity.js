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
    to: forms2.fields.JSDateTime()
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
            db.Activity.find({
                userId: req.user._id,
                start_time: {$lte: form.data.to},
                end_time: {$gte: form.data.from},
            }).select({userId: 0})
              .sort('start_time', 1)
              .exec(noErr(function(docs) {
                res.okJson(docs);
            }));
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
