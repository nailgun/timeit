timeit.SetActivityForm = Backbone.View.extend({
    template: 'set_activity_form.html',
    className: 'timeit-set-activity-form timeit-normal',

    events: {
        'submit form': 'submit',

        'click .timeit-stop': function(e) {
            e.preventDefault();
            timeit.currentActivity(null);
            this.$el.modal('hide');
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
        this.todayView = new timeit.TodayView();
    },

    rendered: function () {
        this.$('input[name="name"]').focus();
        this.$('.timeit-today').html(this.todayView.render().el);

        var view = this;
        this.todayView.on('editClicked', function(activityId) {
            var editForm = new timeit.EditActivityForm(activityId);
            editForm.on('ok', function() {
                view.todayView.render();
            });
            editForm.show();
        });
    },

    submit: function(e) {
        e.preventDefault();

        var activity = timeit.utils.formData(this.$('form'));

        var view = this;
        timeit.currentActivity(activity).ok(function() {
            view.$el.modal('hide');
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
  .mixin(Backbone.ViewMixins.Modal)
  .mixin(Backbone.ViewMixins.ClearError);
