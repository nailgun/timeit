var SetActivityForm = Backbone.View.extend({
    template: 'set_activity_form',

    events: {
        'submit form': 'submit',
        'click .timeit-stop': function(e) {
            e.preventDefault();
            timeit.stopActivity();
            this.$el.modal('hide');
        },
        'hidden .modal': function() {
            this.remove();
        },
        'click table tr': function(e) {
            this.onTableClick(e);
        },

        'dblclick table tr': function(e) {
            this.onTableClick(e);
            this.submit(e);
        },

        'keypress input[type="text"]': 'cleanError',
        'change input': 'cleanError'
    },

    render: function () {
        var view = this;
        $.get('views/'+this.template+'.html', function(html) {
            view.$el.html(html);
            view.$el.find('input[name="name"]').focus();

            view.updateToday();
        });

        return this;
    },

    show: function() {
        this.render().$el.modal('show');
    },

    updateToday: function() {
        var view = this;

        timeit.get('today').ok(function(activities) {
            var $table = view.$el.find('table');
            $table.find('tr:not(.row-template)').remove();
            var $tpl = $table.find('tr.row-template');

            $.each(activities, function(idx, activity) {
                var $row = $tpl.clone();
                $row.removeClass('row-template');

                var start = new Date(activity.start_time);
                var end = new Date(activity.end_time);

                if (timeit.utils.sameDay(start, end)) {
                    $row.children('.start_time').text(
                        timeit.utils.formatDate(start, '%H:%M'));
                }

                $row.children('.end_time').text(
                    timeit.utils.formatDate(end, '%H:%M'));

                $row.children('.activity').text(activity.name);
                if (activity.tags) {
                    $row.children('.tags').text(activity.tags.join(', '));
                }
                $row.children('.duration').text(
                    new timeit.utils.TimeDelta(start, end).toShortString());

                $row.appendTo($table);
            });
        });
    },

    submit: function(e) {
        // TODO: on Enter
        e.preventDefault();

        var name = this.$el.find('input[name="name"]').val();
        var tags = this.$el.find('input[name="tags"]').val();

        var view = this;
        timeit.setActivity(name, tags).ok(function() {
            view.$el.modal('hide');
        }).err(function(report) {
            timeit.utils.setFormErrors(view.$el, report);
        });
    },

    cleanError: function(e) {
        $(e.currentTarget).removeClass('error');
        $(e.currentTarget).parents().removeClass('error');
    },

    onTableClick: function(e) {
        var name = $(e.currentTarget).find('.activity').text();
        var tags = $(e.currentTarget).find('.tags').text();
        this.$el.find('input[name="name"]').val(name);
        this.$el.find('input[name="tags"]').val(tags);
    }
});
