timeit.SetActivityForm = Backbone.View.extend({
    template: 'set_activity_form.html',
    className: 'SetActivityForm',

    events: {
        'submit form': 'submit',

        'click .ti-stop': function(e) {
            e.preventDefault();
            timeit.currentActivity(null);
            this.trigger('done');
        },

        'click .ti-cancel': function(e) {
            e.preventDefault();
            this.trigger('done');
        },

        'click table tr': function(e) {
            this.onTableClick(e);
        },

        'dblclick table tr': function(e) {
            this.onTableClick(e);
            this.submit(e);
        }
    },

    initialize: function() {
        this.recent = new timeit.ActivityListView({
            groupByDate: true,
            allowEdit: true
        });
    },

    context: function (callback) {
        callback({
            showStop: !!timeit.currentActivity()
        });
    },

    updateRecent: function () {
        var view = this;
        timeit.get('today').ok(function(activities) {
            view.recent.render(activities);
        });
    },

    rendered: function () {
        this.$('input[name="name"]').focus();

        this.$('.ti-recent').html(this.recent.el);
        this.updateRecent();

        var view = this;
        this.recent.on('change', function () {
            view.updateRecent();
        });
    },

    submit: function(e) {
        e.preventDefault();

        var activity = timeit.utils.formData(this.$('form'));

        var view = this;
        timeit.currentActivity(activity).ok(function() {
            view.trigger('done');
        }).err(function(report) {
            timeit.utils.setFormErrors(view.$el, report);
        });
    },

    onTableClick: function(e) {
        if (e.target.tagName === 'A') {
            return;
        }
        var activity = {};
        activity.name = $(e.currentTarget).find('.activity').text();
        activity.tags = $(e.currentTarget).find('.tags').text();
        timeit.utils.formData(this.$('form'), activity);
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.ClearError);
