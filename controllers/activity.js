var decors = require('./decors');
var app = require('../app');
var loginRequired = decors.loginRequiredAjax;
var noErr = require('../utils').noErr;
var jsonDumpFormErrors = require('../utils').jsonDumpFormErrors;
var _ = require('underscore');
var forms2 = require('forms2');

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

exports.addEarlier = loginRequired(function (req, res) {
    var form = forms2.create({
        name: forms2.fields.String(),
        tags: forms2.fields.String({required: false}),
        start_time: forms2.fields.JSDateTime(),
        end_time: forms2.fields.JSDateTime({
            validators: [forms2.validators.Max(new Date())],
            errorMessages: {'max_value': 'date is in feature'}
        })
    }, function validate(form, callback) {
        if (form.data.start_time > form.data.end_time) {
            callback('start must be earlier then end', 'start_time');
        } else {
            callback();
        }
    });

    form.handle(req, {
        success: function(form) {
            var tags = parseTags(form.data.tags);
            app.db.collection('activities', noErr(function(collection) {
                collection.insert({
                    account: req.user._id,
                    name: form.data.name,
                    tags: tags,
                    start_time: form.data.start_time,
                    end_time: form.data.end_time,
                }, noErr(function(docs) {
                    res.okJson();
                }));
            }));
        },
        error: jsonDumpFormErrors(res)
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

exports.getCurrent = loginRequired(function(req, res) {
    app.db.collection('activities', noErr(function(activities) {
        activities.find({
            account: req.user._id,
            end_time: null,
        }, ['name', 'start_time']).toArray(noErr(function(docs) {
            res.okJson(docs);
        }));
    }));
});
