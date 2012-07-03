timeit.IntersectionView = Backbone.View.extend({
    template: 'intersection.html',

    initialize: function () {
        this.activityList = new timeit.ActivityListView({
            groupByDate: true,
            allowEdit: true
        });
    },

    rendered: function (activities) {
        this.$('.ti-activities').html(this.activityList.render(activities).el);

        var view = this;
        this.activityList.on('change', function () {
            view.hide();
        });
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.Modal);
