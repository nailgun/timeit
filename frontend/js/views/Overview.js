timeit.OverviewView = Backbone.View.extend({
    template: 'overview.html',
    className: 'OverviewView',

    events: {
        'click .ti-date': 'onDateClick',
        'click .ti-back': 'onBack',
        'click .ti-forward': 'onForward',
        'click .ti-home': 'onHome',
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
        this.activities = [];

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
            el: this.$('.ActivityListView'),
            groupByDate: true,
            allowEdit: true
        });
        this.activityList.on('change', function () {
            view.updateData();
        });
        this.timeline = new timeit.TimeLineView({
            el: this.$('.TimeLineView')
        });
        this.timeline.on('fall', function (newFrom, newTo) {
            if (newTo.diff(newFrom) > (moment.duration(1, 'days') - 1000)) {
                view.from = newFrom;
                view.to = newTo;
                view.onDateChange();
            }
        });
        this.totals = new timeit.TotalsView({
            el: this.$('.TotalsView')
        });
        this.$('a[href="#totals_tab"]').on('shown', function (e) {
            view.totals.render(view.activities);
        });
        this.$('a[href="#activities_tab"]').on('shown', function (e) {
            view.activityList.render(view.activities);
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
            txt = this.from.format('L');
        } else if (props.sameMonth) {
            txt = this.from.format(__('MMM D-')) + this.to.format(__('D, YYYY'));
        } else if (props.sameYear) {
            txt = this.from.format(__('MMM D -')) + this.to.format(__(' MMM D, YYYY'));
        } else {
            txt = this.from.format(__('MMM D, YYYY -')) + this.to.format(__(' MMM D, YYYY'));
        }
        this.$('.ti-txt').text(txt);
        this.updateData();
    },

    updateData: function () {
        this.$('.ti-preloader').show();

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
            view.activities = activities;
            view.timeline.render(view.from, view.to, activities);
            if (view.activityList.$el.is(':visible')) {
                view.activityList.render(view.activities);
            }
            if (view.totals.$el.is(':visible')) {
                view.totals.render(view.activities);
            }
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
    },

    intervalProps: function () {
        return timeit.utils.intervalProps(this.from, this.to);
    },

    onBack: function (e) {
        e.preventDefault();
        var diff = this.to.diff(this.from)+1;
        this.from.subtract(diff);
        this.to.subtract(diff);
        this.onDateChange();
    },

    onForward: function (e) {
        e.preventDefault();
        var diff = this.to.diff(this.from)+1;
        this.from.add(diff);
        this.to.add(diff);
        this.onDateChange();
    },

    onHome: function (e) {
        e.preventDefault();
        this.from = moment().sod();
        this.to = moment().eod();
        this.onDateChange();
    }
}).mixin(Backbone.ViewMixins.Template);
