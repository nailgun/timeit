timeit.TodayView = Backbone.View.extend({
    template: 'activities_table.html',

    context: function (callback) {
        timeit.get('today').ok(function(activities) {
            _.each(activities, function(a) {
                var start = new Date(a.start_time);
                var end = new Date(a.end_time);
                if (timeit.utils.sameDay(start, end)) {
                    a.start_time = timeit.utils.formatDate(start, '%H:%M');
                } else {
                    a.start_time = '';
                }
                a.end_time = timeit.utils.formatDate(end, '%H:%M');
                a.tags = a.tags ? a.tags.join(', ') : '';
                a.duration = new timeit.utils.TimeDelta(start, end).toShortString();
            });

            callback({
                activities: activities
            });
        });
    },

    rendered: function () {
        var view = this;
        this.$('.edit').click(function(e) {
            e.preventDefault();
            view.trigger('editClicked', $(this).data('activity'));
        });
    },
}).mixin(Backbone.ViewMixins.Template);
