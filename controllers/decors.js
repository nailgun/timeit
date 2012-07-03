exports.loginRequiredAjax = function(view, noConfirm) {
    return function(req, res, next) {
        if (req.user) {
            if (req.user.confirmed || noConfirm) {
                view(req, res, next);
            } else {
                res.statusCode = 401;
                res.errJson('confirm_required');
            }
        } else {
            res.statusCode = 401;
            res.errJson('login_required');
        }
    }
};

exports.loginRequired = function(view, noConfirm) {
    return function(req, res, next) {
        if (req.user) {
            if (req.user.confirmed || noConfirm) {
                view(req, res, next);
            } else {
                res.redirect('/confirm.html', 303);
            }
        } else {
            res.redirect('/login.html', 303);
        }
    }
};
