timeit.MassiveEditForm = Backbone.View.extend({
    template: 'massive_edit_form.html',
    className: 'MassiveEditForm',

    events: {
        'submit form': 'submit',

        'click .ti-cancel': function(e) {
            e.preventDefault();
            this.trigger('done');
        },
    },

    initialize: function (name, tags) {
        this.name = name;
        this.tags = tags;
    },

    context: function (callback) {
        callback({
            name: this.name,
            tags: this.tags
        });
    },

    rendered: function () {
        this.$('input[name="name"]').focus();
    },

    submit: function(e) {
        e.preventDefault();

        var data = timeit.utils.formData(this.$('form'));

        var view = this;
        timeit.post('group', {
            oldName: this.name,
            newName: data.name,
            oldTags: this.tags,
            newTags: data.tags
        }).ok(function() {
            view.trigger('done');
            view.trigger('ok');
        }).err(function(descr) {
            if (descr.reason == 'form') {
                timeit.utils.setFormErrors(view.$el, descr.report);
            }
        });
    }
}).mixin(Backbone.ViewMixins.Template)
  .mixin(Backbone.ViewMixins.ClearError);

timeit.MassiveEditFormModal = timeit.MassiveEditForm.extend({
    events: timeit.MassiveEditForm.prototype.events,

    initialize: function () {
        timeit.MassiveEditForm.prototype.initialize.apply(this, arguments);

        this.modal = true;
        var view = this;
        this.on('done', function() {
            view.$el.modal('hide');
        });
    }
}).mixin(Backbone.ViewMixins.Modal);
