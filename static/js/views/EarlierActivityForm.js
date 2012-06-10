timeit.EarlierActivityForm = Backbone.View.extend({
    template: 'earlier_activity_form.html',
    className: 'timeit-normal',

    events: {
        'submit form': 'submit',
        'hidden .modal': function() {
            this.remove();
        }
    },

    rendered: function () {
        this.$('input[name="name"]').focus();

        var today = timeit.utils.formatDate(new Date(), '%d.%m.%Y');
        this.$('input[name="start_date"],input[name="end_date"]')
            .val(today)
            .datepicker({
                format: 'dd.mm.yyyy',
                weekStart: 1
            });
    },

    submit: function(e) {
        e.preventDefault();

        var activity = timeit.utils.formData(this.$('form'));

        function dateFromStrings(date, time) {
            var date_parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(date);
            if (!date_parts || date_parts.length != 4) {
                return null;
            }

            var time_parts = /^(\d+):(\d\d)$/.exec(time);
            if (!time_parts || time_parts.length != 3) {
                return null;
            }

            return new Date(date_parts[3], date_parts[2]-1, date_parts[1],
                    time_parts[1], time_parts[2]);
        }

        activity.start_time = dateFromStrings(activity.start_date, activity.start_time);
        activity.end_time = dateFromStrings(activity.end_date, activity.end_time);

        var view = this;
        timeit.post('activity/add-earlier', activity).ok(function() {
            view.$el.modal('hide');
        }).err(function(descr) {
            if (descr.reason == 'form') {
                timeit.utils.setFormErrors(view.$el, descr.report);
            } else if (descr.reason == 'intersection') {
                new timeit.IntersectionView().show(descr.with);
            }
        });
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.Modal)
  .mixin(Backbone.ViewMixins.ClearError);
