timeit.IntersectionView = Backbone.View.extend({
    template: 'intersection.html',
    className: 'timeit-normal',

    context: function (callback, activities) {
        _.each(activities, function(a) {
            var start = new Date(a.start_time);
            var end = new Date(a.end_time);
            a.start_time = timeit.utils.formatDate(start, '%d.%m.%Y %H:%M');
            a.end_time = timeit.utils.formatDate(end, '%d.%m.%Y %H:%M');
            a.tags = a.tags ? a.tags.join(', ') : '';
            a.duration = new timeit.utils.TimeDelta(start, end).toShortString();
        });

        callback({
            activities: activities
        });
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.Modal);
