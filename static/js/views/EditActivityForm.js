timeit.EditActivityForm = Backbone.View.extend({
    template: 'edit_activity_form.html',
    className: 'EditActivityForm',

    events: {
        'submit form': 'submit',
        'change input.ti-date,input.ti-time': 'updateSlider',
        'changeDate input.ti-date': 'updateSlider',
        'trigger .ti-remove': 'removeActivity',

        'click .ti-cancel': function(e) {
            e.preventDefault();
            this.trigger('done');
        },
    },

    initialize: function (activityId) {
        this.activityId = activityId;
    },

    context: function (callback) {
        var view = this;
        if (this.activityId) {
            timeit.activity(this.activityId).ok(function(a) {
                view.activity = a;

                var templateActivity = _.extend({}, a);
                templateActivity.tags = a.tags ? a.tags.join(', ') : '';

                callback({
                    activity: templateActivity
                });
            });
        } else {
            this.activity = null;
            callback({activity: {
                name: '',
                tags: ''
            }});
        }
    },

    rendered: function () {
        var view = this;
            
        if (this.activity) {
            this.setTimes(this.activity.start_time, this.activity.end_time);

            this.$('.ti-slider').timeSlider({
                from: this.activity.start_time.toDate(),
                to: this.activity.end_time.toDate()
            });
        } else {
            var today = moment().format('DD.MM.YYYY');
            timeit.utils.formData(this.$('form'), {
                start_date: today,
                end_date: today
            });

            this.$('.ti-slider').timeSlider();
        }

        this.$('input.ti-date').datepicker({
            format: 'dd.mm.yyyy',
            weekStart: 1
        });

        this.$('input[name="name"]').focus();

        this.$('input[name="in_progress"]').change(function() {
            var inProgress = $(this).is(':checked');
            view.$('input.ti-end').attr('disabled', inProgress);
            view.updateSlider();
        });

        this.$('.ti-slider').on('change', function(e, from, to) {
            view.$('input[name="in_progress"]').attr('checked', false);
            view.$('input.ti-end').attr('disabled', false);
            view.setTimes(moment(from), moment(to));
        });

        this.$('.ti-remove').holdButton();
    },

    setTimes: function(from, to) {
        timeit.utils.formData(this.$('form'), {
            start_date: from.format('DD.MM.YYYY'),
            end_date: to.format('DD.MM.YYYY'),
            start_time: from.format('HH:mm'),
            end_time: to.format('HH:mm')
        });
    },

    getTimes: function () {
        var data = timeit.utils.formData(this.$('form'));
        var start = moment(data.start_date+'T'+data.start_time, 'DD.MM.YYYYTHH:mm').toDate();
        var end = new Date();
        if (!data.in_progress) {
            end = moment(data.end_date+'T'+data.end_time, 'DD.MM.YYYYTHH:mm').toDate();
        }
        return [start, end];
    },

    updateSlider: function() {
        var times = this.getTimes();
        this.$('.ti-slider').timeSlider('value', times[0], times[1]);
    },

    submit: function(e) {
        e.preventDefault();
        var activity = timeit.utils.formData(this.$('form'));
        if (this.activity) {
            activity._id = this.activity._id;
        }
        var times = this.getTimes();
        activity.start_time = times[0];
        activity.end_time = times[1];

        var view = this;
        timeit.activity(activity).ok(function() {
            view.trigger('done');
            view.trigger('ok');
            if (activity.in_progress) {
                timeit.updateCurrent();
            }
        }).err(function(descr) {
            if (descr.reason == 'form') {
                timeit.utils.setFormErrors(view.$el, descr.report);
            } else if (descr.reason == 'intersection') {
                new timeit.IntersectionView().show(descr.with);
            }
        });
    },

    removeActivity: function () {
        var view = this;
        timeit.post('remove', {
            id: this.activityId
        }).ok(function() {
            view.trigger('done');
            view.trigger('ok');
        });
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.ClearError);

timeit.EditActivityFormModal = timeit.EditActivityForm.extend({
    events: {
        'done': function () {
            this.$el.modal('hide');
        }
    },

    initialize: function () {
        timeit.EditActivityForm.prototype.initialize.apply(this, arguments);
        this.modal = true;
    }
}).mixin(Backbone.ViewMixins.Modal);
