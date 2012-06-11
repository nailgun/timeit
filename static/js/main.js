requirejs.config({
    shim: {
        'jquery': {
            exports: 'jQuery'
        },
        'jquery.favicon': {
            deps: ['jquery'],
            exports: 'jQuery.fn.favicon'
        },
        'bootstrap-modal': {
            deps: ['jquery'],
            exports: 'jQuery.fn.modal'
        },
        'bootstrap-datepicker': {
            deps: ['jquery'],
            exports: 'jQuery.fn.datepicker'
        },
        'underscore': {
            exports: '_'
        },
        'underscore.exttemplate': {
            deps: ['underscore'],
            exports: '_.extTemplate'
        },
        'backbone': {
            //These script dependencies should be loaded before loading
            //backbone.js
            deps: ['underscore', 'jquery'],
            //Once loaded, use the global 'Backbone' as the
            //module value.
            exports: 'Backbone'
        },
        'backbone.mixin': {
            deps: ['backbone'],
            exports: 'Backbone.ViewMixins'
        },
        'backbone.template': {
            deps: ['backbone.mixin', 'underscore.exttemplate'],
            exports: 'Backbone.ViewMixins.Template'
        },
        'backbone.bootstrap': {
            deps: ['backbone.mixin', 'bootstrap-modal'],
            exports: 'Backbone.ViewMixins.Modal'
        }
    }
});

require(['timeit.ui'], function (timeitStart) {
    timeitStart();
});
