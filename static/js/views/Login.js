define(['backbone', 'backbone.template'], function(Backbone) {

return Backbone.View.extend({
    template: 'login.html',

    rendered: function () {
        this.$('input[name="openid"]').focus();
    }
}).mixin(Backbone.ViewMixins.Template);

});
