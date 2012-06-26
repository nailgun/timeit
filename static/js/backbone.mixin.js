(function() {
    var oldExtend = Backbone.View.extend;
    Backbone.View.extend = function() {
        var child = oldExtend.apply(this, arguments);
        child.mixin = function (mixin) {
            mixinView(child, mixin);
            return child;
        };
        return child;
    };
    
    function mixinView (viewClass, mixin) {
        function extend (dst, src) {
            for (var k in src) {
                if (src.hasOwnProperty(k) && !dst.hasOwnProperty(k)) {
                    dst[k] = src[k];
                }
            }
        }

        var viewProto = viewClass.prototype;
        if (typeof mixin.events == 'object') {
            if (typeof viewProto.events === 'undefined') {
                viewProto.events = {};
            }
            if (typeof viewProto.events === 'object') {
                extend(viewProto.events, mixin.events);
            }
        }
        if (typeof mixin.className == 'string' && typeof viewProto.className == 'string') {
            viewProto.className += ' '+mixin.className;
        }
        extend(viewProto, mixin);
    }

    Backbone.ViewMixins = {};
})();
