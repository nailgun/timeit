timeit.IntersectionView = timeit.utils.View.extend({
    template: 'intersection',
    className: 'timeit-normal',

    rendered: function (activities) {
        this.setActivities(activities);
    },

    setActivities: function(activities) {
        var $table = this.$('table');
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
}).mixin(timeit.utils.TemplateMixin).mixin(timeit.utils.ModalMixin);
