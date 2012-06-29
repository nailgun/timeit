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
            stats.activity = _.map(stats.activity, templatize);
            stats.tag = _.map(stats.tag, templatize);
            stats.weekday = _.map(stats.weekday, function (duration, dayNo) {
                return templatize(duration, moment.weekdaysShort[dayNo]);
            });
            stats.total = templatize(stats.total);
            stats.longest.duration = templatize(stats.longest.duration);
            stats.longest.activity.date = moment(stats.longest.activity.start_time).format('MMM DD, YYYY');
            stats.first.date = moment(stats.first.start_time).format('MMM DD, YYYY');
            callback(stats);
        });
    }
}).mixin(Backbone.ViewMixins.Template);
