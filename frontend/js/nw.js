(function () {

window.nw = {};

var __ = function (msg) {
    return msg;
};

nw.redirect = function (path) {
    location.href = path;
};

nw.post = function (url, data, opts) {
    return nw.rpc(url, $.extend({
        type: 'post',
        data: data
    }, opts));
};

nw.get = function (url, data, opts) {
    return nw.rpc(url, $.extend({
        type: 'get',
        data: data
    }, opts));
};

nw.rpc = function (url, opts) {
    opts = $.extend({
        dataType: 'json'
    }, opts);

    var deferred = $.Deferred();
    var fail = deferred.fail;
    deferred.fail = function () {
        this.failExpected = true;
        return fail.apply(this, arguments);
    };

    var xhr = $.ajax(url, opts).fail(function (xhr) {
        if (xhr.status == 401) {
            nw.redirect('.');
        } else {
            var msg = __('Request failed')+' ('+xhr.status;
            if (xhr.statusText) {
                msg += ' '+xhr.statusText;
            }
            msg += ')'
            alert(msg);
        }
    }).done(function (data) {
        if (data.status === 'ok') {
            deferred.resolve(data.body);
        } else if (data.status === 'err') {
            deferred.reject(data.body);
            if (!deferred.failExpected) {
                alert(__('Unexpected error: ') + data.body.toString());
            }
        } else {
            alert(__('Invalid response: ') + data.toString());
        }
    });

    return deferred;
};

})();
