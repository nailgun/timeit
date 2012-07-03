timeit.StatsView = Backbone.View.extend({
    template: 'stats.html',
    className: 'StatsView ti-bar-graph',

    context: function (callback) {
        function max(container) {
            return _.reduce(container, function (memo, value) {
                return Math.max(memo, value);
            }, 0);
        }

        function ms2hours (ms) {
            var hours = ms / moment.duration(1, 'hours');
            return Math.round(hours * 10) / 10;
        }

        function templatize (duration, name) {
            return {
                name: name,
                ms: duration,
                hours: ms2hours(duration)
            };
        }

        timeit.get('stats').ok(function (stats) {
            stats.activityMax = max(stats.activity) || 0;
            stats.tagMax = max(stats.tag) || 0;
            stats.weekdayMax = max(stats.weekday) || 0;
            stats.activity = _.map(stats.activity, function (duration, name) {
                return _.extend(templatize(duration, name), {
                    start: stats.activity_start[name],
                    end: stats.activity_end[name],
                });
            });
            stats.tag = _.map(stats.tag, function (duration, name) {
                return _.extend(templatize(duration, name), {
                    start: stats.tag_start[name],
                    end: stats.tag_end[name],
                });
            });
            stats.weekday = _.map(stats.weekday, function (duration, dayNo) {
                return _.extend(templatize(duration, moment.weekdaysShort[dayNo]), {
                    start: stats.weekday_start[dayNo],
                    end: stats.weekday_end[dayNo]
                });
            });
            stats.total = templatize(stats.total);
            stats.longest.duration = templatize(stats.longest.duration);
            stats.longest.activity.date = moment(stats.longest.activity.start_time).calendar();
            stats.first.date = moment(stats.first.start_time).calendar();
            stats.HOUR = 60 * 60 * 1000;
            stats.DAY = 24 * stats.HOUR;
            callback(stats);
        });
    }
}).mixin(Backbone.ViewMixins.Template);
