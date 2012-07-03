/*
 * i18n module
 * 
 * Based on i18next.js by Jan Mühlemann
 * http://jamuhl.github.com/i18next/
 */

(function ($) {

var i18n = {};

i18n.init = function (opts, callback) {
    opts = $.extend({
        language: navigator.language || navigator.userLanguage,
        localesPath: './locales',
        missingCallback: function () {},
        fallback: 'en'
    }, opts);

    callback = callback || function () {};
    i18n.missing = opts.missingCallback;

    $.getJSON(opts.localesPath+'/'+opts.language+'.js').done(function (locale) {
        i18n.language = opts.language;
        i18n.locale = locale;
        callback();
    }).fail(function () {
        $.getJSON(opts.sorePath+'/'+opts.fallback+'.js').done(function (locale) {
            i18n.language = opts.fallback;
            i18n.locale = locale;
            callback();
        }).fail(function () {
            i18n.language = 'builtin';
            i18n.locale = {};
            callback();
        });
    });
};

function translate (singular, plural) {
    if (plural) {
        if (!i18n.locale[singular]) {
            i18n.locale[singular] = {
                one: singular,
                other: plural
            };
            i18n.missing(singular, plural);
        }
    }

    if (!i18n.locale[singular]) {
        i18n.locale[singular] = singular;
        i18n.missing(singular);
    }

    return i18n.locale[singular];
}

i18n.__ = function (singular) {
    var translation =  translate(singular);
    if (arguments.length > 1) {
        translation = format.apply(translation, Array.prototype.slice.call(arguments, 1));
    }
    return translation;
};

i18n.__n = function (singular, plural, count) {
    var translation =  translate(singular, plural);
    if (count != 1) {
        translation = translation.other;
    } else {
        translation = translation.one;
    }
    translation = format.apply(translation, Array.prototype.slice.call(arguments, 2));
    return translation;
};

function format() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

window.i18n = i18n;

})(jQuery);
