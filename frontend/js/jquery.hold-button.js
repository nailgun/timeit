(function($) {
$.fn.holdButton = function (opts) {
    opts = $.extend({
        hold: null,
        holdText: 'Hold...'
    }, opts);

    return this.each(function () {
        var $btn = $(this);

        var $hold = opts.hold;
        if (!$hold) {
            $hold = $('<span class="badge badge-info"></span>');
            $btn.after($hold);
            $btn.after('&nbsp;');
        }
        $hold.hide();

        var interval = null;

        $btn.on('mousedown', function () {
            var countDown = 3;
            function updateLabel () {
                if (typeof opts.holdText === 'function') {
                    $hold.text(opts.holdText(countDown));
                } else {
                    $hold.text(opts.holdText);
                }
            }

            interval = setInterval(function () {
                countDown--;
                if (countDown == 0) {
                    $hold.hide();
                    clearInterval(interval);
                    $btn.trigger('trigger');
                } else {
                    updateLabel();
                }
            }, 1000);
            $hold.show();
            updateLabel();
        });

        $btn.on('mouseup', function () {
            interval && clearInterval(interval);
            $hold.hide();
        });

        $btn.on('mouseout', function () {
            if (interval) {
                clearInterval(interval);
                $hold.hide();
            }
        });

        $btn.on('click', function (e) {
            e.preventDefault();
        });
    });
};
})(window.jQuery);
