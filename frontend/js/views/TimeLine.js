timeit.TimeLineView = Backbone.View.extend({
    className: 'TimeLineView',

    initialize: function () {
        this.fontSize = 10;
    },

    render: function (from, to, activities) {
        this.from = from;
        this.to = to;

        this.$el.empty();
        this.paper = Raphael(this.el, this.$el.width(), 62);

        var props = timeit.utils.intervalProps(this.from, this.to);
        if (props.sameDay) {
            this.renderIntervals(activities, moment.duration(1, 'hours'), 'HH');
        } else if (props.week) {
            this.renderIntervals(activities, moment.duration(1, 'days'), 'ddd');
        } else if (props.sameMonth) {
            this.renderIntervals(activities, moment.duration(1, 'days'), 'D');
        } else {
            this.renderIntervals(activities, moment.duration(1, 'weeks'), __('MMM, D'));
        }

        return this;
    },

    renderIntervals: function (activities, intervalDuration, captionFormat) {
        var view = this;
        var intervalCount = this.to.diff(this.from) / intervalDuration;

        var intervals = [];
        var maxParticipation = 0;

        var activityIdx = 0;
        var intervalStart = this.from.sod();
        var intervalEnd = moment(intervalStart).add(intervalDuration);
        for (var intervalIdx = 0; intervalIdx < intervalCount; intervalIdx++) {
            var totalParticipation = 0;

            var participate = true;
            while (participate && activityIdx < activities.length) {
                var a = activities[activityIdx];
                participate = false;

                var start = Math.max(a.start_time.valueOf(), intervalStart.valueOf());
                var end = Math.min(a.end_time.valueOf(), intervalEnd.valueOf());
                var participation = end - start;

                if (participation > 0) {
                    totalParticipation += participation;
                    if (a.end_time.valueOf() < intervalEnd.valueOf()) {
                        activityIdx++;
                        participate = true;
                    }
                }
            }

            intervals[intervalIdx] = totalParticipation;
            maxParticipation = Math.max(totalParticipation, maxParticipation);

            intervalStart.add(intervalDuration);
            intervalEnd.add(intervalDuration);
        }

        var intervalWidth = this.paper.width / intervalCount;
        var intervalMaxHeight = this.paper.height - this.fontSize - 2;
        if (maxParticipation == 0) {
            maxParticipation = 1;
        }
        var heightRatio = intervalMaxHeight / maxParticipation;

        intervalStart = this.from.sod();
        for (var intervalIdx = 0; intervalIdx < intervalCount; intervalIdx++) {
            var height = intervals[intervalIdx] * heightRatio;
            if (height < 1) {
                height = 1;
            }

            var x = intervalIdx * intervalWidth;
            this.paper.text(x, this.fontSize/2, intervalStart.format(captionFormat)).attr({
                'text-anchor': 'start',
                'font-size': this.fontSize
            });

            this.paper.rect(x, this.paper.height - height, intervalWidth-2, height).attr({
                fill: '#D4D3D2',
                stroke: '#D4D3D2',
                cursor: 'pointer'
            }).mouseover(function () {
                this.attr({
                    fill: '#A8A7A7',
                    stroke: '#A8A7A7'
                });
            }).mouseout(function () {
                this.attr({
                    fill: '#D4D3D2',
                    stroke: '#D4D3D2'
                });
            }).click((function (intervalStart) {
                return function () {
                    view.trigger('fall',
                        intervalStart,
                        moment(intervalStart).add(intervalDuration-1)
                    );
                }
            })(moment(intervalStart)));

            intervalStart.add(intervalDuration);
        }
    }
});
