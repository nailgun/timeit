(function () {

window.testUtils = window.testUtils || {};

testUtils.mockAjax = function (defaultBody) {
    return sinon.stub($, 'ajax', function (url, options) {
        var deferred = $.Deferred();
        setTimeout(function () {
            if ($.ajax.mockResolve) {
                $.ajax.mockResolve(deferred);
            } else {
                deferred.resolve({
                    status: 'ok',
                    body: defaultBody
                });
            }
        }, 0);
        return deferred;
    });
};

})();
