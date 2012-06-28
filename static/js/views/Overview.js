timeit.OverviewView = Backbone.View.extend({
    template: 'overview.html',
    className: 'OverviewView',

    events: {
        'click .ti-date': 'onDateClick',
        'hide': 'hidePicker'
    },

    initialize: function () {
        this.from = moment().sod();
        this.to = moment().eod();
        this.oneDay = true;

        var view = this;
        this.picker = new timeit.DateRangePickerView();
        this.picker.on('select', function (from, to) {
            view.from = from;
            view.to = to;
            view.hidePicker();
            view.onDateChange();
        });
    },

    context: function (callback) {
        callback({
            overview: this
        });
    },

    rendered: function () {
        this.$('.ti-date')
            .popover({
                title: 'Overview dates',
                placement: 'bottom',
                trigger: 'manual',
                content: this.picker.el
            })

        this.activityList = new timeit.ActivityListView({
            el: this.$('.ti-activities'),
            groupByDate: true,
            allowEdit: true
        });
        this.timeline = new timeit.TimeLineView({
            el: this.$('.ti-timeline')
        });
        this.onDateChange();
    },

    onDateClick: function (e) {
        e.preventDefault();
        this.picker.render(this.from, this.to);
        this.$('.ti-date').popover('toggle');
    },

    hidePicker: function () {
        this.$('.ti-date').popover('hide');
    },

    onDateChange: function () {
        var props = timeit.utils.intervalProps(this.from, this.to);
        var txt;
        if (props.sameDay) {
            txt = this.from.format('MMM D, YYYY');
        } else if (props.sameMonth) {
            txt = this.from.format('MMM D-') + this.to.format('D, YYYY');
        } else if (props.sameYear) {
            txt = this.from.format('MMM D -') + this.to.format(' MMM D, YYYY');
        } else {
            txt = this.from.format('MMM D, YYYY -') + this.to.format('MMM D, YYYY');
        }
        this.$('.ti-txt').text(txt);

        var view = this;
        timeit.get('log', {
            from: this.from.toDate(),
            to: this.to.toDate()
        }).ok(function (activities) {
            _.each(activities, function(a) {
                a.start_time = moment(a.start_time);
                a.end_time = moment(a.end_time);
            });
            view.activityList.render(activities);
            view.timeline.render(view.from, view.to, activities);
        });
    }
}).mixin(Backbone.ViewMixins.Template);
