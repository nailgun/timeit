timeit.EarlierActivityForm = timeit.utils.View.extend({
    template: 'earlier_activity_form',

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
        // TODO: on Enter
        e.preventDefault();

        // TODO: ajaxSubmit
        var name = this.$('input[name="name"]').val();
        var tags = this.$('input[name="tags"]').val();
        var start_date = this.$('input[name="start_date"]').val();
        var start_time = this.$('input[name="start_time"]').val();
        var end_date = this.$('input[name="end_date"]').val();
        var end_time = this.$('input[name="end_time"]').val();

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

        var start = dateFromStrings(start_date, start_time);
        var end = dateFromStrings(end_date, end_time);

        var view = this;
        timeit.post('activity/add-earlier', {
            name: name,
            tags: tags,
            start_time: start,
            end_time: end
        }).ok(function() {
            view.$el.modal('hide');
        }).err(function(descr) {
            if (descr.reason == 'form') {
                timeit.utils.setFormErrors(view.$el, descr.report);
            } else if (descr.reason == 'intersection') {
                new timeit.IntersectionView().show(descr.with);
            }
        });
    }
}).mixin(timeit.utils.TemplateMixin).mixin(timeit.utils.ModalMixin).mixin(timeit.utils.ClearErrorMixin);
