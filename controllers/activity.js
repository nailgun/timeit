var decors = require('./decors');
var app = require('../app');
var loginRequired = decors.loginRequiredAjax;

// FIXME: respect user timezone
exports.today = loginRequired(function(req, res) {
    app.db.collection('activities', function(err, activities) {
        var end = new Date();
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        end.setMilliseconds(999);
        var start = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        activities.find({
            account: req.user._id,
            end_time: {$gte: start, $lte: end},
        }, ['name', 'start_time', 'end_time', 'tags']).sort({end_time: -1}).toArray(function(err, docs) {
            res.json(docs);
        });
    });
});

exports.setCurrent = loginRequired(function (req, res) {
    var activity_name = req.body['name'];
    var tags_string = req.body['tags'];
    var tags = tags_string.split(/\s*,\s*/);

    if (!activity_name) {
        res.statusCode = 400;
        res.json({result: 'error', message: 'activity_name'});
        return;
    }

    app.db.collection('activities', function(err, collection) {
        collection.update({
            account: req.user._id,
            end_time: null,
        }, {
            $set: {end_time: new Date()}
        }, {
            safe: true,
            multi: true
        }, function(err) {
            collection.insert({
                account: req.user._id,
                name: activity_name,
                tags: tags,
                start_time: new Date(),
                end_time: null
            }, function(err, docs) {
                res.json({result: 'done'});
            });
        });
    });
});

exports.addEarlier = loginRequired(function (req, res) {
    try {
        var activity_name = req.body['name'];
        var tags_string = req.body['tags'];
        var tags = tags_string.split(/\s*,\s*/);
        var start_time = new Date(req.body['start_time']);
        var end_time = new Date(req.body['end_time']);
        assert(start_time < end_time, 'start_leser_than_end');
        assert(end_time <= new Date(), 'date_in_feature');
    } catch(err) {
        res.statusCode = 400;
        res.json({result: 'error', message: 'invalid_request'});
        return;
    }

    app.db.collection('activities', function(err, collection) {
        collection.insert({
            account: req.user._id,
            name: activity_name,
            tags: tags,
            start_time: start_time,
            end_time: end_time,
        }, function(err, docs) {
            res.json({result: 'done', id: docs[0]._id});
        });
    });
});

exports.stop = loginRequired(function (req, res) {
    app.db.collection('activities', function(err, collection) {
        collection.update({
            account: req.user._id,
            end_time: null,
        }, {
            $set: {end_time: new Date()}
        }, {
            safe: true, multi: true
        }, function(err, docs) {
            res.json({result: 'done'});
        });
    });
});

exports.getCurrent = loginRequired(function(req, res) {
    app.db.collection('activities', function(err, activities) {
        activities.find({
            account: req.user._id,
            end_time: null,
        }, ['name', 'start_time']).toArray(function(err, docs) {
            res.json(docs);
        });
    });
});
