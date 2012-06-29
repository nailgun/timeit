timeit.TotalsView = Backbone.View.extend({
    template: 'totals.html',
    className: 'TotalsView ti-bar-graph',

    initialize: function () {
        this.totals = {
            activity: {},
            tag: {}
        };
        this.filter = {
            activity: [],
            tag: []
        };
        this.animationDuration = 1000;
    },

    render: function (activities) {
        this.activities = activities;
        if (this.isRendered) {
            this.rendered(activities);
            return this;
        } else {
            return Backbone.ViewMixins.Template.render.apply(this, arguments);
        }
    },

    rendered: function () {
        this.isRendered = true;
        var view = this;

        // reset all
        _.each(this.totals.activity, function (total) {
            total.duration = 0;
            total.display = false;
        });

        _.each(this.totals.tag, function (total) {
            total.duration = 0;
            total.display = false;
        });

        var maxActivityDuration = 0;
        var maxTagDuration = 0;
        var absoluteTotal = 0;

        // sum durations
        _.each(this.activities, function (activity) {
            var total = view.totals.activity[activity.name] = 
                view.totals.activity[activity.name] || {
                    duration: 0
                };
            total.display = true;
            var include = true;

            if (!_.isEmpty(view.filter.activity) && !_.include(view.filter.activity, activity.name)) {
                include = false;
            }

            if (include && !_.all(view.filter.tag, function (tag) {
                return _.include(activity.tags, tag);
            })) {
                include = false;
            }

            var duration = activity.end_time.diff(activity.start_time);
            absoluteTotal += duration;
            if (include) {
                total.duration += duration;
                maxActivityDuration = Math.max(total.duration, maxActivityDuration);
            }

            _.each(activity.tags, function (tag) {
                var total = view.totals.tag[tag] = 
                    view.totals.tag[tag] || {
                        duration: 0
                    };
                total.display = true;

                if (include) {
                    total.duration += activity.end_time.diff(activity.start_time);
                    maxTagDuration = Math.max(total.duration, maxTagDuration);
                }
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

        function addBars ($container, type, max) {
            _.each(view.totals[type], function (total, name) {
                if (!total.display) {
                    if (total.$el) {
                        total.$el.remove();
                        total.$el = null;
                    }
                    return;
                }

                if (!total.$el) {
                    var $caption = $('<div class="ti-caption"></div>');
                    $caption.text(name);

                    total.$bar = $('<div class="ti-single ti-active" style="width: 0"></div>');

                    var $bar = $('<div class="ti-bar"></div>');
                    $bar.append(total.$bar);

                    total.$el = $('<div class="ti-line"></div>');
                    total.$el.append($caption);
                    total.$el.append($bar);

                    $container.append(total.$el);

                    total.$bar.mouseover(function () {
                        total.$bar.addClass('hover');
                    }).mouseout(function () {
                        total.$bar.removeClass('hover');
                    }).click(function () {
                        if (_.include(view.filter[type], name)) {
                            view.filter[type] = _.without(view.filter[type], name);
                            total.$bar.removeClass('active');
                        } else {
                            view.filter[type].push(name);
                            total.$bar.addClass('active');
                        }
                        view.render(view.activities);
                    });
                }

                var maxWidth = total.$bar.parent().width();
                var width = maxWidth * total.duration / max || 1;
                total.$bar.animate({
                    width: width
                }, {
                    duration: view.animationDuration,
                    easing: 'swing'
                });
                total.$bar.html(ms2hours(total.duration)+'&nbsp;');
            });
        }

        addBars(this.$('.ti-activities'), 'activity', maxActivityDuration);
        addBars(this.$('.ti-tags'), 'tag', maxTagDuration);

        this.$('.ti-total').text(ms2hours(absoluteTotal));
    },
}).mixin(Backbone.ViewMixins.Template);
