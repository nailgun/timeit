var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

exports.init = function (connectionString, callback) {
    exports.connection = mongoose.connect(connectionString, function (err) {
        if (!err) {
            exports.mongo = exports.connection.connections[0].db;
        }
        callback(err);
    });

    var Message = new Schema({
        title: String,
        body: String,
        severity: String
    });

    exports.User = exports.connection.model('User', new Schema({
        confirmed: {
            type: Boolean,
            default: false
        },
        registrationDate: {
            type: Date,
            default: Date.now
        },
        links: {},
        settings: {
            username: String,
            notifications: Boolean
        },
        messages: [Message],
    }));

    exports.Activity = exports.connection.model('Activity', new Schema({
        userId: {
            type: ObjectId,
            required: true,
            index: true
        },
        start_time: {
            type: Date,
            required: true
        },
        end_time: Date,
        name: {
            type: String,
            required: true
        },
        tags: [String]
    }));

    exports.User.schema.post('remove', function (next) {
        exports.Activity.remove({
            userId: this._id
        }, function (err) {
            next(err);
        });
    });
};
