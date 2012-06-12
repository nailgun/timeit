exports.AssetCompiler = function(assetStore) {
    return function (context) {
        context.asset = function (name) {
            return assetStore.getInclude(name);
        };
        return context;
    };
};
