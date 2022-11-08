/**
 * author : İlker YILMAZ
 * url : https://github.com/kuantal/Multiple-circular-player
 * inspired by https://github.com/frumbert/circular-player
 */
(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.lunar = factory();
    }
})(this, function () {

    'use strict';

    var lunar = {};

    lunar.hasClass = function (elem, name) {
        return new RegExp('(\\s|^)' + name + '(\\s|$)').test(elem.attr('class'));
    };

    lunar.addClass = function (elem, name) {
        !lunar.hasClass(elem, name) && elem.attr('class', (!!elem.getAttribute('class') ? elem.getAttribute('class') + ' ' : '') + name);
    };

    lunar.removeClass = function (elem, name) {
        var remove = elem.attr('class').replace(new RegExp('(\\s|^)' + name + '(\\s|$)', 'g'), '$2');
        lunar.hasClass(elem, name) && elem.attr('class', remove);
    };

    lunar.toggleClass = function (elem, name) {
        lunar[lunar.hasClass(elem, name) ? 'removeClass' : 'addClass'](elem, name);
    };

    lunar.className = function (elem, name) {
        elem.attr('class', name);
        console.log('className', elem);
    };

    return lunar;

});

(function ($) {

    var _ = {

        cursorPoint: function (evt, el) {
            _.settings.pt.x = evt.clientX;
            _.settings.pt.y = evt.clientY;
            var playObject  = el.find('svg').attr('id');
            playObject      = document.getElementById(playObject);
            return _.settings.pt.matrixTransform(playObject.getScreenCTM().inverse());
        },

        angle: function (ex, ey) {
            var dy    = ey - 50; // 100;
            var dx    = ex - 50; // 100;
            var theta = Math.atan2(dy, dx); // range (-PI, PI]
            theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
            theta     = theta + 90; // in our case we are animating from the top, so we offset by the rotation value;
            if (theta < 0) theta = 360 + theta; // range [0, 360)
            return theta;
        },

        setGraphValue: function (obj, val, el) {

            var audioObj = el.find(_.settings.audioObj),
                pc       = _.settings.pc,
                dash     = pc - parseFloat(((val / audioObj[0].duration) * pc), 10);

            $(obj).css('strokeDashoffset', dash);

            if (val === 0) {
                $(obj).addClass(obj, 'done');
                if (obj === $(_.settings.progress)) $(obj).attr('class', 'ended');
            }
        },

        reportPosition: function (el, audioId) {
            var progress = el.find(_.settings.progress),
                audio    = el.find(_.settings.audioObj);

            _.setGraphValue(progress, audioId.currentTime, el);
        },

        stopAllSounds: function () {

            document.addEventListener('play', function (e) {
                var audios = document.getElementsByTagName('audio');
                for (var i = 0, len = audios.length; i < len; i++) {
                    if (audios[i] != e.target) {
                        audios[i].pause();
                    }
                    if (audios[i] != e.target) $(audios[i]).parent('div').find('.playing').attr('class', 'paused');
                }
            }, true);
        },

        settings: {},

        /**
         * Main Function for plugin
         * @param options
         */
        init: function (options) {

            /**
             * Default Options
             */

            var template = ['<div class="controls"><div id="play" class="play"></div><div id="pause" class="pause"></div></div>',
                '<svg viewBox="0 0 100 100" id="playable" version="1.1" xmlns="http://www.w3.org/2000/svg" width="178" height="178" data-play="playable" class="not-started playable">',
                '<g class="shape">',
                '<circle class="progress-track" cx="50" cy="50" r="47.45" stroke="#ffffff" stroke-opacity="0.25" stroke-linecap="round" fill="none" stroke-width="2.5"/>',
                '<circle class="precache-bar" cx="50" cy="50" r="47.45" stroke="#ffffff" stroke-opacity="0.25" stroke-linecap="round" fill="none" stroke-width="2.5" transform="rotate(-90 50 50)"/>',
                '<circle class="progress-bar" cx="50" cy="50" r="47.45" stroke="#E94E98" stroke-opacity="1" stroke-linecap="round" fill="none" stroke-width="2.5" transform="rotate(-90 50 50)"/>',
                '</g>',
                '</svg>',
                '<p class="media_label">Dr. David Morris,<br>',
                'Head of Wellness',
                '</p>'
                ];


            template = template.join(' ');

            $.each(this, function (a, b) {
                
                var audio = $(this).find('audio');
                audio.attr('id', 'audio' + a);
                template = template.replace('width="34"','width="'+ audio.data('size')  +'"');
                template = template.replace('height="34"','height="'+ audio.data('size')  +'"');
                template = template.replace('id="playable"', 'id="playable' + a + '"');
                $(this).append(template);
                
            });

            var svgId = $(this).find('svg').attr('id');
            svgId     = document.getElementById(svgId);

            _.defaults = {
                this        : this,
                thisSelector: this.selector.toString(),
                playObj     : 'playable',
                progress    : '.progress-bar',
                precache    : '.precache-bar',
                audioObj    : 'audio',
                controlsObj : '.controls',
                pt          : svgId.createSVGPoint(),
                pc          : 298.1371428256714 // 2 pi r                                
            };

            lunar = {};

            _.settings = $.extend({}, _.defaults, options);

            $(_.settings.controlsObj).on('click', function (e) {

                var el = $(e.currentTarget).closest($(_.settings.thisSelector));

                var obj = {
                    el         : el,
                    activeAudio: el.find(_.settings.audioObj),
                    playObj    : el.find('[data-play]'),
                    precache   : el.find(_.settings.precache)
                };

                obj.class = obj.playObj.attr('class');

                switch (obj.class.replace('playable', '').trim()) {

                    case 'not-started':
                        _.stopAllSounds();
                        obj.activeAudio[0].play();
                        var audioId = document.getElementById(obj.activeAudio.attr('id'));
                        audioId.addEventListener('timeupdate', function (e) {
                            _.reportPosition(el, audioId)
                        });
                        obj.playObj.attr('class', 'playing');
                        
                        document.getElementById("play").style.display = 'none';
                        document.getElementById("pause").style.display = 'block';

                        break;
                    case 'playing':
                        obj.playObj.attr('class', 'playable paused');
                        obj.activeAudio[0].pause();
                        $(audioId).off('timeupdate');

                        document.getElementById("play").style.display = 'block';
                        document.getElementById("pause").style.display = 'none';

                        break;
                    case 'paused':
                        obj.playObj.attr('class', 'playable playing');
                        obj.activeAudio[0].play();

                        document.getElementById("play").style.display = 'none';
                        document.getElementById("pause").style.display = 'block';

                        break;
                    case 'ended':
                        obj.playObj.attr('class', 'not-started playable');
                        obj.activeAudio.off('timeupdate', _.reportPosition);
                        break;
                }
            });

            $(_.defaults.audioObj).on('progress', function (e) {
                if (this.buffered.length > 0) {
                    var end = this.buffered.end(this.buffered.length - 1);
                    var cache = $(e.currentTarget).parent().find(_.settings.precache),
                        el    = $(this).closest($(_.settings.thisSelector));
                    _.setGraphValue(cache, end, el);
                }
            });

        }

    };

    // Add Plugin to Jquery
    $.fn.mediaPlayer = function (methodOrOptions) {
        if (_[methodOrOptions]) {
            return _[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return _.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.mediaPlayer');
        }
    };
})(jQuery);


$(document).ready(function () {

  var windowHeight = $(window).innerHeight();

  function getWindowHeight() {
    return windowHeight;
  }

  $(window).on("resize", function () {
    windowHeight = $(window).innerHeight();
  });             


  var controller = new ScrollMagic.Controller();
  controller.scrollTo(function(target) {

    TweenMax.to(window, 0.5, {
      scrollTo : {
        y : target, 
        autoKill : true,
      },
      ease : Cubic.easeInOut
    });

  });

  $('.nav__anchor').click(function(e) {
    var id = $(this).attr("href"); 

    if($(id).length > 0) {
      e.preventDefault();
      controller.scrollTo(id);
    }
  });

  $('.nav__anchor').mouseenter(function(e) {
    var text = $(this).find( ".nav__tooltip" );
    var line = $(this).find( ".nav__tooltip__line" );

    var tt = new TimelineMax();
    tt.to(line, 0.15,  { ease: Sine.easeInOut, width:"20px" }, 0.1);
    tt.to(text, 0.15,  { ease: Sine.easeInOut, opacity:1, y:+0 }, 0.1);
  });

  $('.nav__anchor').mouseleave(function(e) {
    var text = $(this).find( ".nav__tooltip" );
    var line = $(this).find( ".nav__tooltip__line" );

    var tt = new TimelineMax();
    tt.to(text, 0.15,  { ease: Sine.easeInOut, opacity:0, y:-5 }, 0.1);
    tt.to(line, 0.15,  { ease: Sine.easeInOut, width:"0" }, 0.1);
  });

  var tween_nav12 = new TimelineMax();
  tween_nav12.to(".nav__line--1", 0.25,  { ease: Sine.easeInOut, height:"0" }, 0.0);
  tween_nav12.to(".nav__line--2", 0.25,  { ease: Sine.easeInOut, height:"50px", backgroundColor:"rgb(106, 185, 128)" }, 0.0);
  tween_nav12.to(".nav__dot--1", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(255, 255, 255)" }, 0.0);
  tween_nav12.to(".nav__tooltip", 0.25,  { ease: Sine.easeInOut, color:"rgb(255, 255, 255)" }, 0.0);
  tween_nav12.to(".nav__tooltip__line", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(255, 255, 255)" }, 0.0);
  tween_nav12.to(".nav__dot--2", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(106, 185, 128)" }, 0.0);

  var pinIntroScene = new ScrollMagic.Scene({

    triggerElement: '#section2',
    triggerHook: 10,
    duration: getWindowHeight,
    offset: 0

  })
  //.setPin('#section1', {pushFollowers: false})
  .setTween(tween_nav12)
  .addTo(controller);


  var tween_nav23 = new TimelineMax();
  tween_nav23.to(".nav__dot--1", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(110, 38, 123)" }, 0.0);
  tween_nav23.to(".nav__dot--2", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(110, 38, 123)" }, 0.0);
  tween_nav23.to(".nav__tooltip", 0.25,  { ease: Sine.easeInOut, color:"rgb(110, 38, 123)" }, 0.0);
  tween_nav23.to(".nav__tooltip__line", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(110, 38, 123)" }, 0.0);
  tween_nav23.to(".nav__dot--3", 0.25,  { ease: Sine.easeInOut, backgroundColor:"rgb(106, 185, 128)" }, 0.0);
  tween_nav23.to(".sticky", 0.25,  { ease: Sine.easeInOut, y:-120 }, 0.0);

  var pinMiddleScene = new ScrollMagic.Scene({

    triggerElement: '#section3',
    triggerHook: 10,
    duration: getWindowHeight,
    offset: 50

  })
  //.setPin('#section2', {pushFollowers: false})
  .setTween(tween_nav23)
  .addTo(controller);


  $('.container').each(function(){

    var fadeScene = new ScrollMagic.Scene({
      triggerElement: this.children[0],
      triggerHook: 0.9,
    })
    .setClassToggle(this, 'fade-in')
    .addTo(controller);

  });


  $('.media_player').mediaPlayer();

 });



