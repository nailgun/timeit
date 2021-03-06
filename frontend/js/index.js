(function () {
    start();

    function start () {
        $(function() {
            timeit.init(onTimeItInitialized);
        });
    }

    function onTimeItInitialized () {
        $(window).on('beforeunload', function() {
            if (timeit.currentActivity()) {
                return __('Keeping activity on the go!');
            }
        });

        timeit.fetchMessages();

        timeit.get('settings').ok(function(settings) {
            initUi(settings);
        });
    }

    function initUi (settings) {
        var account = new timeit.AccountView(settings.username);
        $('#nav').append(account.render().el);

        var tracker = new timeit.TrackerView();
        $('#tracker').html(tracker.render().el);

        tracker.on('click', function() {
            var setActivity = new timeit.SetActivityForm();
            $('#tracker').html(setActivity.render().el);
            setActivity.on('done', function () {
                $('#tracker').html(tracker.el);
                tracker.delegateEvents();
            });
        });

        tracker.on('addEarlier', function() {
            var addActivity = new timeit.EditActivityForm();
            $('#tracker').html(addActivity.render().el);
            addActivity.on('done', function () {
                $('#tracker').html(tracker.el);
                tracker.delegateEvents();
            });
        });

        var overview = new timeit.OverviewView();
        $('a[href="#overview"]').data('view', overview);
        $('#overview').html(overview.el);

        var stats = new timeit.StatsView();
        $('a[href="#stats"]').data('view', stats);
        $('#stats').html(stats.el);

        var massiveEdit = new timeit.MassiveEditListView();
        $('a[href="#massive"]').data('view', massiveEdit);
        $('#massive').html(massiveEdit.el);

        var help = new timeit.HelpView();
        $('a[href="#help"]').data('view', help);
        $('#help').html(help.el);

        $('.nav a').on('shown', function () {
            var view = $(this).data('view');
            if (view) {
                view.render();
            }
        });

        timeit.initActivity();

        setInterval(tick, 1000);
        if (settings.notifications || settings.notifications === undefined) {
            timeit.setNotifications(true, settings.notifications);
        } else {
            timeit.setNotifications(false);
        }
    }

    function tick() {
        if (timeit.currentActivity()) {
            var favicon = $('link[rel="shortcut icon"]').attr('href');
            if (favicon == 'ico/empty.ico') {
                $.favicon('ico/favicon.ico');
            } else {
                $.favicon('ico/empty.ico');
            }

            timeit.trigger('tick');
        } else {
            $.favicon('ico/favicon.ico');
        }
    }
})();
