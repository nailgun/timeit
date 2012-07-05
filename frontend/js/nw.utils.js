(function () {

var exports = {}
if (typeof module !== 'undefined') {
    exports = module.exports;
} else {
    exports = nw.utils = {};
}

nw.utils.capitalize = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

})();
