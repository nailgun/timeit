(function($) {

var minute = 60 * 1000;
var hour = 60 * minute;
var day = 24 * hour;

var Widget = function (container, width, height, centerDate) {
    var widget = {};

    paper = Raphael(container, width, height);
    widget.$ = $(container).find('svg');

    var center = paper.width / 2;

    function line(x0, y0, x1, y1) {
        return paper.path('M'+x0+','+y0+'L'+x1+','+y1);
    }

    function ms2x (ms) {
        var delta = ms - centerDate.getTime();
        return center + delta * paper.width / day;
    }

    function x2ms (x) {
        var delta = (x - center) * day / paper.width;
        return centerDate.getTime() + delta;
    }

    function x2date (x) {
        return new Date(x2ms(x));
    }

    var start = new Date(centerDate.getTime() - (day / 2));
    start.setMilliseconds(0);
    start.setSeconds(0);
    start.setMinutes(0);
    start = start.getTime();
    var end = start + day + hour;

    var baseHeight = paper.height - 12 - 12;

    for (var ms = start; ms < end; ms += 15*minute) {
        var date = new Date(ms);

        var height;
        var text = '';
        if (date.getMinutes() == 0) {
            if (date.getHours() == 0) {
                height = baseHeight;
            } else {
                height = baseHeight / 3;
            }

            if (date.getHours() % 4 == 0) {
                if (date.getHours() == 0) {
                    text = moment(date).format('Do MMMM');
                } else {
                    text = moment(date).format('HH:mm');
                }
            }

        } else {
            height = baseHeight / 6;
        }

        var x = ms2x(ms);
        if (x > 0) {
            line(
                x, paper.height - 12,
                x, paper.height - height - 12
            ).attr({
                'stroke-width': 1,
                'stroke': '#777'
            });

            if (text) {
                paper.text(x, 5, text).attr({
                    'text-anchor': 'start',
                    'font-size': '10px'
                });
            }
        }
    }

    var selectionRect = paper.rect(-2, 12, 0, paper.height - 24).attr({
        'fill': '#05c',
        'stroke': '#05c',
        'fill-opacity': 0.5
    });

    widget.setSelection = function(x1, x2) {
        if (x1 instanceof Date && x2 instanceof Date) {
            x1 = ms2x(x1.getTime());
            x2 = ms2x(x2.getTime());
        }

        if (x1 > x2) {
            x1 = -1;
            x2 = -1;
        }

        var width = x2 - x1;
        if (width < 1) {
            width = 1;
        }

        selectionRect.attr({
            x: x1,
            width: width
        });
    };

    widget.getSelection = function() {
        var x1 = selectionRect.attr('x');
        var x2 = x1 + selectionRect.attr('width');
        return [x2date(x1), x2date(x2)];
    };

    var pointerLine = paper.rect(-1, 12, 1, paper.height - 24).attr({
        'stroke': '#05c',
        'fill': '#05c',
        'stroke-opacity': 0
    });

    var pointerText = paper.text(-1, paper.height - 5, '').attr({
        'text-anchor': 'start',
        'font-size': '10px'
    });

    widget.movePointer = function(x) {
        pointerLine.attr('x', x);
        var text = '';
        if (x >= 0) {
            var date = x2date(x);
            text = moment(date).format('HH:mm');
        }
        pointerText.attr({
            'text': text,
            'x': x,
            'text-anchor': x < center ? 'start' : 'end'
        });
    };

    return widget;
};

var methods = {
    init: function (opts) {
        opts = opts || {};
        if (!opts.center) {
            if (opts.from && opts.to) {
                var ms = (opts.from.getTime() + opts.to.getTime()) / 2;
                opts.center = new Date(ms);
            } else {
                opts.center = new Date();
            }
        }

        return this.each(function () {
            var $this = $(this),
                widget = $this.data('time-slider');

            if (!widget) {
                widget = Widget(this, $this.width(), 62, opts.center);
                var $widget = widget.$;
                $this.data('time-slider', widget);

                var downX = -1;
                $widget.on('mousedown', function(e) {
                    var x = e.pageX - $widget.offset().left;
                    downX = x;
                });
                $widget.on('mousemove', function(e) {
                    var x = e.pageX - $widget.offset().left;
                    widget.movePointer(x);
                    if (downX >= 0) {
                        if (downX < x) {
                            widget.setSelection(downX, x);
                        } else {
                            widget.setSelection(x, downX);
                        }

                        var dates = widget.getSelection();
                        $this.trigger('change', dates);
                    }
                });
                $widget.on('mouseup', function(e) {
                    downX = -1;
                });
                $widget.on('mouseout', function(e) {
                    widget.movePointer(-1);
                });

                if (opts.from && opts.to) {
                    widget.setSelection(opts.from, opts.to);
                }

                $widget.disableSelection();
                $widget.css('cursor', 'default');
            }
        });
    },
    
    value: function (from, to) {
        return this.each(function () {
            var $this = $(this),
                widget = $this.data('time-slider');

            if (from !== undefined && to !== undefined) {
                widget.setSelection(from, to);
            } else {
                var dates = widget.getSelection();
                from = dates[0];
                to = dates[1];
            }
        });

        return [from, to]
    }
};

$.fn.timeSlider = function (method) {
    if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || ! method) {
        return methods.init.apply(this, arguments);
    } else {
        $.error('Method '+method+' does not exist on jQuery.timeSlider');
    }
};

})(window.jQuery);
