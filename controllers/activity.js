var decors = require('./decors');
var app = require('../app');
var loginRequired = decors.loginRequiredAjax;
var noErr = require('../utils').noErr;
var jsonDumpFormErrors = require('../utils').jsonDumpFormErrors;
var _ = require('underscore');
var forms2 = require('forms2');
var BSON = require('mongodb').BSONPure;

function parseTags(tagsString) {
    var tags = tagsString.split(/\s*,\s*/);
    return _.uniq(tags.sort());
}

// FIXME: respect user timezone
exports.today = loginRequired(function(req, res) {
    app.db.collection('activities', noErr(function(activities) {
        var end = new Date();
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        end.setMilliseconds(999);
        var start = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        activities.find({
            account: req.user._id,
            end_time: {$gte: start, $lte: end},
        }, [
            'name',
            'start_time',
            'end_time',
            'tags'
        ]).sort({end_time: -1}).toArray(noErr(function(docs) {
            res.okJson(docs);
        }));
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
            app.db.collection('activities', noErr(function(collection) {
                collection.update({
                    account: req.user._id,
                    end_time: null,
                }, {
                    $set: {end_time: new Date()}
                }, {
                    safe: true,
                    multi: true
                }, noErr(function() {
                    collection.insert({
                        account: req.user._id,
                        name: form.data.name,
                        tags: tags,
                        start_time: new Date(),
                        end_time: null
                    }, noErr(function(docs) {
                        res.okJson();
                    }));
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

                app.db.collection('activities', noErr(function(activities) {
                    activities.findOne({
                        account: req.user._id,
                        end_time: null
                    }, [
                        'name'
                    ], noErr(function(doc) {
                        if (doc) {
                            return callback({
                                message: 'activity '+doc.name+' already in progress'
                            });
                        } else {
                            return callback();
                        }
                    }));
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

            app.db.collection('activities', noErr(function(collection) {
                var queryEndTime;
                if (form.data.in_progress) {
                    queryEndTime = new Date();
                } else {
                    queryEndTime = form.data.end_time;
                }

                var query = { 
                    account: req.user._id,
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
                        $ne: new BSON.ObjectID(req.body._id)
                    };
                }

                // check for intersection
                collection.find(query, {
                    account: 0
                }).sort({end_time: 1}).toArray(noErr(function(docs) {
                    if (docs.length) {
                        res.errJson({
                            reason: 'intersection',
                            with: docs
                        });
                    } else {
                        var data = {
                            account: req.user._id,
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
                            collection.insert(data, noErr(function(docs) {
                                res.okJson();
                            }));
                        } else {
                            collection.update({
                                _id: new BSON.ObjectID(req.body._id)
                            }, {
                                $set: data
                            }, noErr(function(docs) {
                                res.okJson();
                            }));
                        }
                    }
                }));
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
    app.db.collection('activities', noErr(function(collection) {
        collection.update({
            account: req.user._id,
            end_time: null,
        }, {
            $set: {end_time: new Date()}
        }, {
            safe: true, multi: true
        }, noErr(function(docs) {
            res.okJson();
        }));
    }));
});

exports.get = loginRequired(function(req, res) {
    var query = {
        account: req.user._id
    };
    if (req.query.id) {
        query._id = new BSON.ObjectID(req.query.id);
    } else {
        query.end_time = null;
    }

    app.db.collection('activities', noErr(function(activities) {
        activities.findOne(query, {
            account: 0
        }, noErr(function(doc) {
            res.okJson(doc);
        }));
    }));
});
