(function() {
    Backbone.ViewMixins.Modal = {
        className: 'modal',

        events: {
            'hidden': function() {
                this.remove();
            }
        },

        show: function() {
            this.render.apply(this, arguments).$el.modal();
        }
    };

    Backbone.ViewMixins.ClearError = {
        events: {
            'keypress input[type="text"]': 'cleanError',
            'change input': 'cleanError'
        },

        cleanError: function(e) {
            $(e.currentTarget).removeClass('error');
            $(e.currentTarget).parents().removeClass('error');
        }
    };
})();
