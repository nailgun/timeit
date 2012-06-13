var cache = require('./cache');

module.exports = function(cacheVersion) {
    var contentCache = {
        version: cacheVersion
    };

    contentCache.get = function(type, name, callback) {
        var cid = contentId(type, name);
        cache.get(cid, callback);
    };

    contentCache.set = function(type, name, content, callback) {
        var cid = contentId(type, name);
        cache.set(cid, content, callback);
    };

    contentCache.invalidate = function(type, name, callback) {
        var cid = contentId(type, name);
        cache.set(cid, undefined, function(err) {
            if (callback) {
                callback(err);
            }
        });
    };

    function contentId(type, name) {
        return cacheVersion+':'+type+':'+name;
    };

    return contentCache;
};
