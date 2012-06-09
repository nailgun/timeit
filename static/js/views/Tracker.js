timeit.TrackerView = Backbone.View.extend({
    template: 'tracker',
    className: 'timeit-tracker',

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

        var view = this;
        timeit.on('activityChanging', function() {
            view.pending();
        });
        timeit.on('activityChanged', function() {
            view.update();
        });
        timeit.on('tick', function() {
            view.updateTimer();
        });
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

        var activity = timeit.currentActivity();
        if (activity) {
            this.$('.timeit-name').text(activity.name);
            this.$('.timeit-subtext').text('');
            this.updateTimer();
        } else {
            this.$('.timeit-name').text('No activity');
            this.$('.timeit-subtext').text('Click here to set activity');
            this.$('.timeit-timer').text('');
        }
    },

    pending: function() {
        this.valid = true;

        this.$('.timeit-name').text('Working...');
        this.$('.timeit-subtext').text('Please take a while');
    },

    updateTimer: function() {
        var activity = timeit.currentActivity();
        if (activity) {
            var ms = timeit.timeElapsedMs();
            var text = new timeit.utils.TimeDelta(ms).format('%H:%0M:%0S')[0];
            this.$('.timeit-timer').text(text);
        }
    }
});
