var cache = require('./cache');

module.exports = function() {
    var validContent = {};
    var contentCache = {};

    contentCache.get = function(type, name, callback) {
        var cid = contentId(type, name);
        if (validContent[cid]) {
            cache.get(cid, function(err, content) {
                callback(err, content);
            });
        } else {
            callback(new Error('not found'));
        }
    };

    contentCache.set = function(type, name, content, callback) {
        var cid = contentId(type, name);
        cache.set(cid, content, function(err) {
            if (!err) {
                validContent[cid] = 1;
            }
            callback(err);
        });
    };

    function contentId(type, name) {
        return type+':'+name;
    };

    return contentCache;
};
