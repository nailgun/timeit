timeit.TotalsView = Backbone.View.extend({
    template: 'totals.html',
    className: 'TotalsView',

    initialize: function () {
        this.totals = {
            activities: {},
            tags: {}
        };
        this.animationDuration = 1000;
    },

    render: function (activities) {
        if (this.isRendered) {
            this.rendered(activities);
            return this;
        } else {
            return Backbone.ViewMixins.Template.render.apply(this, arguments);
        }
    },

    rendered: function (activities) {
        this.isRendered = true;
        var view = this;

        // reset duration
        _.each(this.totals.activities, function (total) {
            total.duration = 0;
        });

        _.each(this.totals.tags, function (total) {
            total.duration = 0;
        });

        var maxActivityDuration = 0;
        var maxTagDuration = 0;
        var absoluteTotal = 0;

        // sum durations
        _.each(activities, function (activity) {
            var total = view.totals.activities[activity.name] = 
                view.totals.activities[activity.name] || {
                    duration: 0
                };
            var duration = activity.end_time.diff(activity.start_time);
            total.duration += duration;
            absoluteTotal += duration;
            maxActivityDuration = Math.max(total.duration, maxActivityDuration);

            _.each(activity.tags, function (tag) {
                var total = view.totals.tags[tag] = 
                    view.totals.tags[tag] || {
                        duration: 0
                    };
                total.duration += activity.end_time.diff(activity.start_time);
                maxTagDuration = Math.max(total.duration, maxTagDuration);
            });
        });
        
        if (maxActivityDuration == 0) {
            maxActivityDuration = 1;
        }
        
        if (maxTagDuration == 0) {
            maxTagDuration = 1;
        }

        function ms2hours (ms) {
            var hours = ms / moment.duration(1, 'hours');
            return Math.round(hours * 10) / 10;
        }

        function addBars ($container, totals, max) {
            _.each(totals, function (total, name) {
                if (total.duration == 0) {
                    if (total.$el) {
                        total.$el.remove();
                        total.$el = null;
                    }
                    return;
                }

                if (!total.$el) {
                    var $caption = $('<span class="ti-caption"></span>');
                    $caption.text(name);
                    var $bar = $('<div class="ti-bar"></div>');
                    total.$bar = $('<span style="width: 0"> </span>');
                    $bar.append(total.$bar);
                    total.$el = $('<div class="ti-line"></div>');
                    total.$el.append($bar);
                    total.$el.append($caption);

                    $container.append(total.$el);
                }

                var maxWidth = total.$bar.parent().width();
                total.$bar.animate({
                    width: maxWidth * total.duration / max
                }, {
                    duration: view.animationDuration,
                    easing: 'swing'
                });
                total.$bar.text(ms2hours(total.duration));
            });
        }

        addBars(this.$('.ti-activities'), this.totals.activities, maxActivityDuration);
        addBars(this.$('.ti-tags'), this.totals.tags, maxTagDuration);

        this.$('.ti-total').text(ms2hours(absoluteTotal));
    },
}).mixin(Backbone.ViewMixins.Template);
