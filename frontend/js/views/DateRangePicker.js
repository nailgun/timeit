timeit.DateRangePickerView = Backbone.View.extend({
    template: 'date_range_picker.html',
    className: 'DateRangePickerView',

    events: {
        'submit form': 'onSubmit',
        'click .ti-pick': 'onPick'
    },

    context: function (callback, from, to) {
        this.day = [to.sod(), to.eod()];
        this.week = [moment(to).day(1).sod(), moment(to).day(7).eod()];
        this.month = [moment(to).date(1).sod(), moment(to).month(to.month()+1).date(0).eod()];

        var props = timeit.utils.intervalProps(this.week[0], this.week[1]);
        var weekTxt;
        if (props.sameMonth) {
            weekTxt = this.week[0].format('MMM D-') + this.week[1].format('D, YYYY');
        } else if (props.sameYear) {
            weekTxt = this.week[0].format('MMM D -') + this.week[1].format(' MMM D, YYYY');
        } else {
            weekTxt = this.week[0].format('MMM D, YYYY -') + this.week[1].format('MMM D, YYYY');
        }

        callback({
            day: this.day[0].format('MMM D, YYYY'),
            week: weekTxt,
            month: this.month[0].format('MMM D-') + this.month[1].format('D, YYYY'),
            from: from.format('DD.MM.YYYY'),
            to: to.format('DD.MM.YYYY'),
        });
    },
    
    rendered: function () {
        this.delegateEvents();
        this.$('input[name="from"],input[name="to"]').datepicker({
            format: 'dd.mm.yyyy',
            weekStart: 1
        });
    },

    onSubmit: function (e) {
        e.preventDefault();
        this.pickRange();
    },

    onPick: function (e) {
        e.preventDefault();
        var pick = this[$(e.target).data('pick')];
        this.trigger('select', pick[0], pick[1]);
    },

    pickRange: function () {
        var data = timeit.utils.formData(this.$('form'));
        var from = moment(data.from, 'DD.MM.YYYY').sod();
        var to = moment(data.to, 'DD.MM.YYYY').eod();
        if (from.toDate() > to.toDate()) {
            var tmp = from;
            from = to;
            to = tmp;
        }
        this.trigger('select', from, to);
    }
}).mixin(Backbone.ViewMixins.Template);
