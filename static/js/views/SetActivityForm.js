timeit.SetActivityForm = timeit.utils.View.extend({
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

    rendered: function () {
        this.$('input[name="name"]').focus();
        this.$('.timeit-today').html(new timeit.TodayView().render().el);
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
        var activity = {};
        activity.name = $(e.currentTarget).find('.activity').text();
        activity.tags = $(e.currentTarget).find('.tags').text();
        timeit.utils.formData(this.$('form'), activity);
    }
}).mixin(timeit.utils.TemplateMixin).mixin(timeit.utils.ModalMixin).mixin(timeit.utils.ClearErrorMixin);
