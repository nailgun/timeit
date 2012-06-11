define([
    'timeit.utils',
    'backbone',
    'backbone.template',
    'backbone.bootstrap'
], function(utils, Backbone) {

return Backbone.View.extend({
    template: 'intersection.html',
    className: 'timeit-normal',

    context: function (callback, activities) {
        _.each(activities, function(a) {
            var start = new Date(a.start_time);
            var end = new Date(a.end_time);
            a.start_time = utils.formatDate(start, '%d.%m.%Y %H:%M');
            a.end_time = utils.formatDate(end, '%d.%m.%Y %H:%M');
            a.tags = a.tags ? a.tags.join(', ') : '';
            a.duration = new utils.TimeDelta(start, end).toShortString();
        });

        callback({
            activities: activities
        });
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.Modal);

});
