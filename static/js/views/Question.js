timeit.QuestionView = Backbone.View.extend({
    template: 'question.html',
    className: 'timeit-normal',

    events: {
        'click .ti-ok': 'onOk',
        'click .ti-cancel': 'onCancel'
    },

    context: function (callback, title, content) {
        callback({
            title: title,
            content: content
        });
    },

    onOk: function (e) {
        e.preventDefault();
        this.trigger('ok');
    },

    onCancel: function (e) {
        e.preventDefault();
        this.trigger('cancel');
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.Modal);
