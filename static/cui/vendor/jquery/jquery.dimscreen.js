//dimScreen()
//by Brandon Goldman
jQuery.extend({
    //dims the screen
    dimScreen: function(speed, opacity, callback) {
        if(jQuery('#__dimScreen').size() > 0) return;
        
        if(typeof speed == 'function') {
            callback = speed;
            speed = null;
        }

        if(typeof opacity == 'function') {
            callback = opacity;
            opacity = null;
        }

        if(speed < 1) {
            var placeholder = opacity;
            opacity = speed;
            speed = placeholder;
        }
        
        if(opacity >= 1) {
            var placeholder = speed;
            speed = opacity;
            opacity = placeholder;
        }

        speed = (speed > 0) ? speed : 500;
        opacity = (opacity > 0) ? opacity : 0.5;
        return jQuery('<div></div>').attr({
                id: '__dimScreen'
                ,fade_opacity: opacity
                ,speed: speed
            }).css({
            background: '#000'
            ,left: '0px'
            ,opacity: 0
            ,position: 'absolute'
            ,top: '0px'
            ,height:jQuery(document).height()+'px'
            ,width:jQuery(document).width()+'px'
            ,zIndex: 999
        }).appendTo(document.body).fadeTo(speed, opacity, callback);
    },
    
    //stops current dimming of the screen
    dimScreenStop: function(callback) {
        var x = jQuery('#__dimScreen');
        var opacity = x.attr('fade_opacity');
        var speed = x.attr('speed');
        x.fadeOut(speed, function() {
            x.remove();
            if(typeof callback == 'function') callback();
        });
    }
});

