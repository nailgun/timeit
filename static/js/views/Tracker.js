timeit.TrackerView = Backbone.View.extend({
    template: 'tracker.html',
    className: 'TrackerView',

    events: {
        'click .ti-set-activity': function(e) {
            e.preventDefault();
            timeit.valid && this.trigger('click');
        },
        'click .ti-add-earlier-btn': function(e) {
            e.preventDefault();
            timeit.valid && this.trigger('addEarlier');
        }
    },

    initialize: function () {
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

    rendered: function () {
        if (timeit.valid) {
            this.update();
        }
    },

    update: function() {
        var activity = timeit.currentActivity();
        if (activity) {
            this.$('.ti-name').text(activity.name);
            this.$('.ti-subtext').text('');
            this.updateTimer();
        } else {
            this.$('.ti-name').text(__('No activity'));
            this.$('.ti-subtext').text(__('Click here to set activity'));
            this.$('.ti-timer').text('');
        }
    },

    pending: function() {
        this.$('.ti-name').text(__('Working...'));
        this.$('.ti-subtext').text(__('Please take a while'));
    },

    updateTimer: function() {
        var activity = timeit.currentActivity();
        if (activity) {
            var ms = timeit.timeElapsedMs();
            var text = new timeit.utils.TimeDelta(ms).format('%H:%0M:%0S')[0];
            this.$('.ti-timer').text(text);
        }
    }
}).mixin(Backbone.ViewMixins.Template);
