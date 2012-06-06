exports.loginRequiredAjax = function(view) {
    return function(req, res, next) {
        if (req.user) {
            view(req, res, next);
        } else {
            res.statusCode = 401;
            res.json({error: 'login_required'});
        }
    }
};
