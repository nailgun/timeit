var TrackerView = Backbone.View.extend({
    template: 'tracker',

    events: {
        'click .timeit-now': function(e) {
            e.preventDefault();
            this.valid && this.trigger('click');
        },
        'click .timeit-add-earlier-btn': function(e) {
            e.preventDefault();
            this.valid && this.trigger('addEarlier');
        },
        'click .timeit-overview-btn': function(e) {
            e.preventDefault();
            this.valid && this.trigger('overview');
        }
    },

    initialize: function () {
        this.valid = false;
    },

    render: function () {
        var view = this;
        $.get('views/'+this.template+'.html', function(html) {
            view.$el.html(html);
            if (this.valid) {
                view.update();
            }
        });

        return this;
    },

    update: function() {
        this.valid = true;

        if (timeit.current_activity) {
            this.$el.find('.timeit-name').text(timeit.current_activity);
            this.$el.find('.timeit-subtext').text('');

            document.title = timeit.current_activity + ' — TimeIt';
        } else {
            this.$el.find('.timeit-name').text('No activity');
            this.$el.find('.timeit-subtext').text('Click here to set activity');

            document.title = 'No activity — TimeIt';
        }
    }
});
