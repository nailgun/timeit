timeit.OverviewView = Backbone.View.extend({
    template: 'overview.html',
    className: 'OverviewView',

    events: {
        'click .ti-date': 'onDateClick',
        'hide': 'hidePicker',
        'keyup .search-query': 'onSearchQueryChange',
        'submit form': 'forceSearch'
    },

    initialize: function () {
        this.from = moment().sod();
        this.to = moment().eod();
        this.oneDay = true;
        this.searchTimeout = null;
        this.prevSearch = '';
        this.search = '';

        var view = this;
        this.picker = new timeit.DateRangePickerView();
        this.picker.on('select', function (from, to) {
            view.from = from;
            view.to = to;
            view.hidePicker();
            view.onDateChange();
        });
    },

    rendered: function () {
        var view = this;
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
        this.activityList.on('change', function () {
            view.updateData();
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
        this.$('.ti-preloader').show();
        this.updateData();
    },

    updateData: function () {
        var view = this;
        timeit.get('log', {
            from: this.from.toDate(),
            to: this.to.toDate(),
            search: this.search
        }).ok(function (activities) {
            this.$('.ti-preloader').hide();
            _.each(activities, function(a) {
                a.start_time = moment(a.start_time);
                a.end_time = moment(a.end_time);
            });
            view.activityList.render(activities);
            view.timeline.render(view.from, view.to, activities);
        });
    },

    onSearchQueryChange: function (e) {
        if (e.which == 13) {
            return;
        }

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.$('.ti-preloader').show();

        var view = this;
        this.searchTimeout = setTimeout(function () {
            view.forceSearch();
        }, 1000);
    },

    forceSearch: function (e) {
        if (e) {
            e.preventDefault();
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
        this.search = this.$('.search-query').val();
        if (this.prevSearch != this.search) {
            this.prevSearch = this.search;
            this.updateData();
        } else {
            this.$('.ti-preloader').hide();
        }
    }
}).mixin(Backbone.ViewMixins.Template);
