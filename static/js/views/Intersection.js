var IntersectionView = Backbone.View.extend({
    template: 'intersection',

    events: {
        'hidden .modal': function() {
            this.remove();
        },
    },

    render: function (activities) {
        var view = this;
        $.get('views/'+this.template+'.html', function(html) {
            view.$el.html(html);
            view.setActivities(activities);
        });

        return this;
    },

    show: function(activities) {
        this.render(activities).$el.modal('show');
    },

    setActivities: function(activities) {
        var $table = this.$el.find('table');
        $table.find('tr:not(.row-template)').remove();
        var $tpl = $table.find('tr.row-template');

        $.each(activities, function(idx, activity) {
            var $row = $tpl.clone();
            $row.removeClass('row-template');
            var start = new Date(activity.start_time);
            var end = new Date(activity.end_time);
            $row.children('.start_time').text(
                timeit.utils.formatDate(start, '%d.%m.%Y %H:%M'));
            $row.children('.end_time').text(
                timeit.utils.formatDate(end, '%d.%m.%Y %H:%M'));
            $row.children('.activity').text(activity.name);
            if (activity.tags) {
                $row.children('.tags').text(activity.tags.join(', '));
            }
            $row.children('.duration').text(
                new timeit.utils.TimeDelta(start, end).toShortString());
            $row.appendTo($table);
        });
    }
});
