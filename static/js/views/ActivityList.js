timeit.ActivityListView = Backbone.View.extend({
    template: 'activity_list.html',
    className: 'timeit-normal',

    events: {
        'click .edit': 'onEdit'
    },

    initialize: function (opts) {
        this.groupByDate = opts.groupByDate;
        this.allowEdit = opts.allowEdit;
    },

    context: function (callback, activities) {
        var grouped = [];
        var groupByDate = this.groupByDate;

        function sameDay (a, b) {
            return a && b && a.format('YYYYMMDD') === b.format('YYYYMMDD');
        };

        _.each(activities, function(a) {
            var a = _.extend({}, a);
            a.start = moment(a.start_time);
            a.end = moment(a.end_time);
            a.tags = a.tags ? a.tags.join(', ') : '';
            a.duration = moment.humanizeDuration(a.end.diff(a.start));

            if (groupByDate && (grouped.length === 0 || !sameDay(grouped[grouped.length-1].end, a.start))) {
                a.day = a.start.format('MMM D, YYYY');
            }

            a.start_time = a.start.format('HH:mm');
            if (sameDay(a.start, a.end)) {
                a.end_time = a.end.format('HH:mm');
                grouped.push(a);
            } else {
                a.end_time = '';
                grouped.push(a);

                var a2 = _.extend({}, a);
                a2.day = a2.end.format('MMM D, YYYY');
                a2.start_time = '';
                a2.end_time = a2.end.format('HH:mm');
                grouped.push(a2);
            }
        });

        callback ({
            activities: grouped,
            allowEdit: this.allowEdit
        });
    },

    onEdit: function (e) {
        e.preventDefault();
        var view = this;

        var editForm = new timeit.EditActivityForm($(e.target).data('activity'));
        editForm.on('ok', function() {
            view.trigger('change', $(this).data('activity'));
        });
        editForm.show();
    }
}).mixin(Backbone.ViewMixins.Template);
