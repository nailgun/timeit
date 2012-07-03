timeit.MassiveEditListView = Backbone.View.extend({
    template: 'massive_edit_list.html',
    className: 'MassiveEditListView',

    events: {
        'click .ti-edit': 'onEdit'
    },

    context: function (callback) {
        timeit.get('groups').ok(function (groups) {
            groups = _.sortBy(groups, function (group) {
                return group.name + group.tags.join();
            });
            callback({
                groups: groups
            });
        });
    },

    onEdit: function (e) {
        e.preventDefault();
        var $tr = $(e.target).parents('tr');
        var name = $tr.find('.ti-name').text();
        var tags = $tr.find('.ti-tags').text();

        var editForm = new timeit.MassiveEditFormModal(name, tags);
        editForm.show();

        var view = this;
        editForm.on('ok', function () {
            view.render();
        });
    }
}).mixin(Backbone.ViewMixins.Template);
