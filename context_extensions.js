exports.AssetCompiler = function(assetStore) {
    return function (context) {
        context.wrap('asset', function (callback, name) {
            return assetStore.getInclude(name, callback);
        });
        return context;
    };
};
