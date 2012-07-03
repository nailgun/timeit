(function($) {
$.fn.holdButton = function () {
    return this.each(function () {
        var $btn = $(this);
        var $hold = $('<span class="badge badge-info"></span>');
        $hold.hide();
        $btn.after($hold);
        $btn.after('&nbsp;');

        var interval = null;

        $btn.on('mousedown', function () {
            var countDown = 3;
            function updateLabel () {
                $hold.text('Hold '+countDown+'...');
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
