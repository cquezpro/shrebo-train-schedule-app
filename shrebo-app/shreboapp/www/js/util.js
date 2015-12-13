define(['jquery', 'backbone', 'underscore', 'settings', 'spin', 'moment', 'geocoder', 'libs/sha1'], function($, $B, _, settings, Spinner, moment, GeoCoder, sha1) {
    var viewManager = {
        current : null,
        /**
         * instantiate a view based on parameters and the designated parent
         *
         * use as
         *
         * var view = viewManager.create(SomeView, { ... }, "selector");
         * viewManager.show(view)
         *
         * @memberOf viewManager
         */
        create : function(viewClass, param, parent) {
            // create view
            if (parent) {
                $(parent).empty();
            }
            var el = $(parent).append('<div class="view" style="height:100%"></div>');
            el = $(parent).children('.view');
            var param = _.extend(param, {
                'el' : el
            });
            var view = new viewClass(param);
            return view;
        },
        show : function(view) {
            // dismiss previous view
            if (this.current) {
                if (app.settings.fade) {
                    this.current.$el.fadeOut();
                } else {
                    this.current.$el.hide();
                };
                this.current.off('touchend');
                this.current.close();
            }
            // show new view
            this.current = view;
            this.current.render();
            // mobile fixup
            this.fixup(this.current);
            // see if there is a view specific menu to render
            // if not use the default
            if (view.renderMenu) {
                view.renderMenu();
            } else {
                app.renderMenu();
            }
            // if there is a current time display, start app's interval
            app.startTimeUpdate && app.startTimeUpdate();
            return this;
        },
        showSubview : function(view) {
            // show new view
            this.current.subview = view;
            this.current.subview.render();
            this.current.subview.show();
            return this;
        },
        /**
         * load a page. uses JQM's changePage to do so, otherwise uses
         * window.location.href see
         * http://demos.jquerymobile.com/1.4.2/backbone-requirejs/
         */
        changePage : function(selector, transition) {
            if (false && $.mobile) {
                transition = transition || $.mobile.defaultPageTransition;
                $('body').pagecontainer("change", selector, {
                    transition : transition,
                    reverse : false,
                    changeHash : false,
                });
            } else {
                // FIXME this is a straight forward test w/o jq
                // because the @#! was slow
                var vm = this;
                vm._touchTimeStamp = 0;
                $('.ui-page-active').removeClass('ui-page.active');
                $(selector).addClass('ui-page-active');
                $(selector).show();
                app.trigger('page_changed', selector);
                $(selector).on('touchstart', function(e) {
                    vm._touchTimeStamp = e.timeStamp;
                    vm._touchTarget = e.target;
                    /*
                     * vm._touchXY = { x : e.touches[0].clientX, y :
                     * e.touches[0].clientY, }
                     */
                });
                // see
                // http://phonegap-tips.com/articles/fast-touch-event-handling-eliminate-click-delay.html
                $(selector).on('touchend', function(e) {
                    if (e.timeStamp - vm._touchTimeStamp > 75) {
                        // check this was a click, otherwise
                        // let other components handle e.g. swipe etc.
                        /*
                         * _touchXY = { x : e.touches[0].clientX, y :
                         * e.touches[0].clientY, } if(Math.abs(_touchXY.x -
                         * vm._touchXY.x) <= 10 && Math.abs(_touchXY.y -
                         * vm._touchXY.y) <= 10) { }
                         */
                        if (vm._touchTarget != e.target) {
                            return;
                        }
                        // let the browser handle anchor tags
                        // we click on everything else...
                        if (!$(e.target).is('a')) {
                            e.preventDefault();
                        }
                        $(e.target).trigger('click', e);
                        vm._touchTimeStamp = e.timeStamp;
                    }
                });
            }
            return this;
        },
        /**
         * mobile fix ups
         */
        fixup : function() {
            // ensure focus on click in input boxes
            // http://stackoverflow.com/questions/25256499/keyboard-not-showing-on-input-focus-android-ionic
            $('input[type=text]').on('click', function(e) {
                $(e.target).focus();
            });
            $('textarea').on('click', function(e) {
                $(e.target).focus();
            });
        },
        /**
         * render a menu item
         *
         * @param container
         *            selector for the container of the menu
         * @param items
         * @param the
         *            template as a string
         *
         * items is an array of menu items, where each item has the following
         * properties. Use the .menuItem function to create menu items.
         *
         * <pre>
         * .href   the href to set on the anchor
         * .text   the text to display
         * .icon   the icon to display (as classes, e.g. fa fa-icon)
         * </pre>
         */
        renderMenu : function(container, items, tmpl) {
            $(container).empty();
            $(container).append(_.template(tmpl, {
                menu : items
            }));
        },
        /**
         * convenience factory function to return a menuItem used by renderMenu
         *
         * @param href
         * @param text
         * @param icon
         * @returns a menu item
         */
        menuItem : function(href, text, icon) {
            return {
                href : href,
                text : text,
                icon : icon
            };
        }
    };
    // utility functions
    var util = {
        /**
         * render a template using the context object
         *
         * @param {Object}
         *            template
         *
         * @memberOf util
         */
        render : function(tmpl, context) {
            return (_.template(tmpl, context));
        },
        /**
         * load with a deferred object
         */
        required : function(modules) {
            var d = $.Deferred();
            require(modules, function(m) {
                d.resolve(m);
            });
            return d.promise();
        },
        /**
         * console.debug
         */
        debug : function(text) {
            if (settings.debug) {
                console.log('[DEBUG] ' + text);
            };
        },
        /**
         * console.trace
         */
        trace : function(text) {
            if (settings.debug) {
                console.log('[TRACE] ' + text);
            };
        },
        /**
         * format strings
         */
        format : function(string) {
            args = arguments.length == 2 ? arguments[1] : arguments.slice(1);
            return string.replace(/{(\w+)}/g, function(match, idx) {
                return typeof args[idx] != "undefined" ? args[idx] : match;
            });
        },
        /**
         * get ISO date string from a Date object
         *
         * @param date
         * @return string as yyyy-mm-ddTHH:ii
         */
        dateISO : function(date) {
            return $.mobiscroll.formatDate("yyyy-mm-ddTHH:ii", date);
        },
        /**
         * return true if url is valid
         *
         * @param url
         *            input string
         * @return true if appears a valid url, false otherse
         */
        validUrl : function(url) {
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain
            // name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i');
            return pattern.test(url);
        },
        /**
         * check if we are running in simulator
         */
        isSimulator : function() {
            // Simulator == Android Simulator
            // Generic == Ripple Emulator
            // anything else we assume is an actual device
            try {
                var ripple = window.parent && window.parent.ripple;
                var simulator = window.device.platform.match(/Simulator|Generic/) != null;
                return ripple || simulator;
            } catch (e) {
                return false;
            }
        },
        /**
         * generate uuid
         *
         * Here's a similar RFC4122 version 4 compliant solution that solves
         * that issue by offsetting the first 13 hex numbers by a hex portion of
         * the timestamp. That way, even if Math.random is on the same seed,
         * both clients would have to generate the UUID at the exact same
         * millisecond (or 10,000+ years later) to get the same UUID source:
         * http://stackoverflow.com/a/8809472/890242
         */
        uuid : function() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return uuid;
        },
        /**
         * use util.navigate instead of window.location.href this will use the
         * Backbone workspace to cause the navigation which seems to avoid
         * triggering problems with jquery mobile (?)
         *
         * In order to avoid deep stacks, uses setTimeout to trigger the
         * navigation in the next JS event loop
         *
         * Note: this requires window.app.workspace to exist and be a valid
         * Backbone.Workspace instance.
         */
        navigate : function(uri) {
            // use timeout to avoid deep call stacks
            setTimeout(function() {
                app.workspace.navigate(uri, {
                    trigger : true,
                });
            }, 100);
        },
        /**
         * retrun the indicator. if the ActivityIndicator plugin is installed,
         * will use this.
         *
         * use:
         *
         * var progress = util.progress(container, message); progress.show();
         * ... progress.hide();
         *
         * note: use settings.css_progress = true; to force the css progress
         * indicator
         *
         */
        progress : function(container, message) {
            message = message | "";
            if (!settings.css_progress && !this.isSimulator()) {
                // return platform variant
                return ActivityIndicator;
            } else {
                // create a CSS/html custom variant
                var style = 'z-index:99;position:absolute;top:40%;left:25%;width:50%;height:25%;color:white;display:table;';
                var html = '<div style="display:none" class=".css-spinner">';
                html += '<div style="{0}">'.format([style]);
                html += '<div style="text-align:center;vertical-align:bottom;display:table-cell">'
                // html += '{0}'.format([message]);
                html += '</div></div>';
                var el = $(html.format([style, message]));
                $(container).append(el);
                var progress = {
                    show : function() {
                        $('.css-spinner').hide();
                        this.spinner = new util.Spinner().spin();
                        el.show();
                        el.append(this.spinner.el);
                    },
                    hide : function() {
                        // remove any that may have been created previously
                        $(this.spinner.el).remove();
                        $('.css-spinner').remove();
                        el.hide();
                    }
                };
                return progress;
            }
        },
        /**
         * simple side bar menu
         *
         * use as util.panel('selector' [, options]);
         *
         * options:
         *
         * duration : duration in ms (default 300) for panel toggle and
         * animation width : width in pct (default 40) toggler : the toggler (a
         * href) selector default href=selector pushoff : the selector of all
         * elements that get pushed to the right navbar : if there is a navbar,
         * specify its selector to adjust the top offset of the panel animate :
         * if true will use jquery animate for the pushoff. otherwise will set
         * the left offset without animation in either case, the panel will be
         * toggled with the duration given (rationale: on slow devices, animate
         * false will still appear as a fade-in)
         */
        panel : function(selector, options) {
            var default_options = {
                duration : 0, // duration in ms
                width : .4, // width in percent
                toggler : $('[href="{0}"]'.format([selector])),
                pushoff : "[data-role='page'],.top-bar",
                navbar : ".topbar",
                animate : false,
            };
            var panel = $(selector);
            options = _.defaults(options || {}, default_options);
            // add close handler for any clicks
            panel.find('a').on('click', function(e) {
                $(options.toggler).trigger('click', e.target);
            });
            // position panel
            $(selector).css('top', $(options.navbar).height());
            // install click handler
            $(options.toggler).on('click', function(e) {
                e.preventDefault();
                // get the panel and all content that is currently
                // visible (immediate children of body)
                var visibleOnPage = $(options.pushoff).filter(':visible');
                // toggle visibility
                // this works by animate-move the visible
                // content to the right by the width given
                // and concurrently toggle the display of
                // the panel
                if (panel.is(':hidden')) {
                    var offset = visibleOnPage.width() * options.width;
                    $(selector).toggle(options.duration);
                    if (options.animate) {
                        visibleOnPage.animate({
                            left : offset
                        }, options.duration);
                    } else {
                        visibleOnPage.css('left', offset);
                    };
                } else {
                    $(selector).toggle(options.duration);
                    if (options.animate) {
                        $(visibleOnPage).animate({
                            left : 0
                        });
                    } else {
                        visibleOnPage.css('left', 0);
                    };
                };
            });
        },
        /**
         * sort array by the < and > comparators on the natural value of the
         * elements (unlike the default sort() which sorts alphanumerically.
         * Sort is in place.
         *
         * @param array
         * @returns sorted array
         */
        sortArray : function(array) {
            return array.sort(function(a, b) {
                // see
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;
            });
        },
        /**
         * transform a list of values into an alphabet-keyed dictionary. You can
         * customize what the key should be.
         *
         * e.g. input is
         *
         * var list = ["Elsie Chambers", "Gene Keller", "Glen Hall", "Lawrence
         * Burke", "Lenora Robbins", "Lillian Stone", "Lucy Roberson", "Mario
         * Curry", "Shawn Matthews", "Terry Joseph"]
         *
         * asAlphabetDictionary(list) => {"A":["Adrian Stanley"],"F":["Fred
         * Houston"],"H":["Hilda Hart"], "I":["Irene Coleman"],"J":["Jeffery
         * Castillo","Jon Floyd","Jonathan Conner"],"L":["Leon
         * Higgins"],"N":["Nettie Jensen"],"S":["Sally Simon"]}
         *
         * @param array
         *            the list of values to transform
         * @param options
         *            see below source:
         *            https://gist.github.com/miraculixx/3eb9d2f2d64e5567b8a1
         *
         * options: .full return the full alphabet, non only letters that have
         * entries in the list .sorted if true the function does not sort again
         * .keyfn a function to return the key of a an element .valuefn a
         * function to return the value of an element
         *
         * If .keyfn is not provided, defaults to return the first letter of the
         * value of each element. If provided in the form keyfn(v) it shall
         * return the first letter of each element v.
         *
         * If .valuefn is not provided, defaults to the String value of each
         * element. Note that valuefn is called on every element of the input
         * array and essentially transforms each element into its string
         * representation.
         *
         * By providing both valuefn and keyfn you can generate arbitrary keys
         * and value entries.
         *
         */
        asAlphabetDictionary : function(list, options) {
            // parse options
            var full = options.full;
            var sorted = options.sorted;
            var keyfn = options.keyfn;
            var valuefn = options.valuefn;
            // prepare alphabet dict
            var dict = {};
            if (full) {
                // generate alphabet A..Z
                var alpha = String.fromCharCode.apply(this, _.range(65, 65 + 26));
                _.each(alpha.split(''), function(v) {
                    dict[v] = new Array();
                });
            }
            // sort if needed
            if (!sorted) {
                list = list.sort();
            }
            // setup value function if not provided
            if (!valuefn) {
                valuefn = function(v) {
                    return String(v);
                };
            }
            // setup key function if not provided
            if (!keyfn) {
                keyfn = function(v) {
                    return String(v).substring(0, 1).toUpperCase();
                };
            }
            // go through list and return dictionary
            _.each(list, function(v, k, l) {
                var letter = keyfn(v);
                if (!full && !( letter in dict)) {
                    dict[letter] = new Array();
                }
                dict[letter].push(valuefn(v));
            });
            return dict;
        },
        /**
         * collect various techniques to find the platform
         *
         * quest is the platform like ios, android, web
         */
        isPlatform : function(quest) {
            switch(true) {
            case (device && device.platform.toLowerCase() == quest):
                ans = true;
                break;
            default:
                ans = false;
            }
            return ans;
        },
        /**
         * hide keyboard
         */
        hideKeyboard : function() {
            /* http://petercorvers.nl/phonegapcordova-hide-ios-keyboard/ */
            if (util.isPlatform("ios")) {
                document.activeElement.blur();
                $("input").blur();
            };
        },
    };
    // create an abstraction for localStorage
    // rationale: make it easily adjustable for
    // backward compatibility or secure storage.
    // also make the interface simpler using
    // set/get instead of setItem/getItem
    var storage = {
        /**
         * store a key / value pair
         */
        set : function(key, value) {
            window.localStorage.setItem(key, JSON.stringify(value));
            return this;
        },
        /**
         * retrieve value for key
         */
        get : function(key) {
            var value = window.localStorage.getItem(key);
            // try to parse as JSON, if not valid, return value as
            // as such
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        },
        /**
         * remove key from storage
         */
        del : function(key) {
            window.localStorage.removeItem(key);
            return this;
        }
    };
    // add progress indicator
    util.Spinner = Spinner;
    util.storage = storage;
    // setup console debug
    console.debug = util.debug;
    console.trace = util.trace;
    // install the viewManager as a global object
    window.viewManager = viewManager;
    // string formatting
    String.prototype.format = function() {
        var args = arguments.length == 1 ? arguments[0] : arguments;
        return util.format(this, args);
    };
    // string latinisation (remove diacritics)
    // source http://stackoverflow.com/a/9667752/890242
    // this is the base64 of the string given in the source,
    // which is the result of btoa(unescape(encodeURIComponent(<string>)))
    // see http://mzl.la/1yq4WwR this has the nice property that there won't be
    // any corruption of strings on transfer, minifying etc.
    var base64map = "eyLDgSI6IkEiLCLEgiI6IkEiLCLhuq4iOiJBIiwi4bq2IjoiQSIsIuG6sCI6IkEiLCLhurIiOiJBIiwi4bq0IjoiQSIsIseNIjoiQSIsIsOCIjoiQSIsIuG6pCI6IkEiLCLhuqwiOiJBIiwi4bqmIjoiQSIsIuG6qCI6IkEiLCLhuqoiOiJBIiwiw4QiOiJBIiwix54iOiJBIiwiyKYiOiJBIiwix6AiOiJBIiwi4bqgIjoiQSIsIsiAIjoiQSIsIsOAIjoiQSIsIuG6oiI6IkEiLCLIgiI6IkEiLCLEgCI6IkEiLCLEhCI6IkEiLCLDhSI6IkEiLCLHuiI6IkEiLCLhuIAiOiJBIiwiyLoiOiJBIiwiw4MiOiJBIiwi6pyyIjoiQUEiLCLDhiI6IkFFIiwix7wiOiJBRSIsIseiIjoiQUUiLCLqnLQiOiJBTyIsIuqctiI6IkFVIiwi6py4IjoiQVYiLCLqnLoiOiJBViIsIuqcvCI6IkFZIiwi4biCIjoiQiIsIuG4hCI6IkIiLCLGgSI6IkIiLCLhuIYiOiJCIiwiyYMiOiJCIiwixoIiOiJCIiwixIYiOiJDIiwixIwiOiJDIiwiw4ciOiJDIiwi4biIIjoiQyIsIsSIIjoiQyIsIsSKIjoiQyIsIsaHIjoiQyIsIsi7IjoiQyIsIsSOIjoiRCIsIuG4kCI6IkQiLCLhuJIiOiJEIiwi4biKIjoiRCIsIuG4jCI6IkQiLCLGiiI6IkQiLCLhuI4iOiJEIiwix7IiOiJEIiwix4UiOiJEIiwixJAiOiJEIiwixosiOiJEIiwix7EiOiJEWiIsIseEIjoiRFoiLCLDiSI6IkUiLCLElCI6IkUiLCLEmiI6IkUiLCLIqCI6IkUiLCLhuJwiOiJFIiwiw4oiOiJFIiwi4bq+IjoiRSIsIuG7hiI6IkUiLCLhu4AiOiJFIiwi4buCIjoiRSIsIuG7hCI6IkUiLCLhuJgiOiJFIiwiw4siOiJFIiwixJYiOiJFIiwi4bq4IjoiRSIsIsiEIjoiRSIsIsOIIjoiRSIsIuG6uiI6IkUiLCLIhiI6IkUiLCLEkiI6IkUiLCLhuJYiOiJFIiwi4biUIjoiRSIsIsSYIjoiRSIsIsmGIjoiRSIsIuG6vCI6IkUiLCLhuJoiOiJFIiwi6p2qIjoiRVQiLCLhuJ4iOiJGIiwixpEiOiJGIiwix7QiOiJHIiwixJ4iOiJHIiwix6YiOiJHIiwixKIiOiJHIiwixJwiOiJHIiwixKAiOiJHIiwixpMiOiJHIiwi4bigIjoiRyIsIsekIjoiRyIsIuG4qiI6IkgiLCLIniI6IkgiLCLhuKgiOiJIIiwixKQiOiJIIiwi4rGnIjoiSCIsIuG4piI6IkgiLCLhuKIiOiJIIiwi4bikIjoiSCIsIsSmIjoiSCIsIsONIjoiSSIsIsSsIjoiSSIsIsePIjoiSSIsIsOOIjoiSSIsIsOPIjoiSSIsIuG4riI6IkkiLCLEsCI6IkkiLCLhu4oiOiJJIiwiyIgiOiJJIiwiw4wiOiJJIiwi4buIIjoiSSIsIsiKIjoiSSIsIsSqIjoiSSIsIsSuIjoiSSIsIsaXIjoiSSIsIsSoIjoiSSIsIuG4rCI6IkkiLCLqnbkiOiJEIiwi6p27IjoiRiIsIuqdvSI6IkciLCLqnoIiOiJSIiwi6p6EIjoiUyIsIuqehiI6IlQiLCLqnawiOiJJUyIsIsS0IjoiSiIsIsmIIjoiSiIsIuG4sCI6IksiLCLHqCI6IksiLCLEtiI6IksiLCLisakiOiJLIiwi6p2CIjoiSyIsIuG4siI6IksiLCLGmCI6IksiLCLhuLQiOiJLIiwi6p2AIjoiSyIsIuqdhCI6IksiLCLEuSI6IkwiLCLIvSI6IkwiLCLEvSI6IkwiLCLEuyI6IkwiLCLhuLwiOiJMIiwi4bi2IjoiTCIsIuG4uCI6IkwiLCLisaAiOiJMIiwi6p2IIjoiTCIsIuG4uiI6IkwiLCLEvyI6IkwiLCLisaIiOiJMIiwix4giOiJMIiwixYEiOiJMIiwix4ciOiJMSiIsIuG4viI6Ik0iLCLhuYAiOiJNIiwi4bmCIjoiTSIsIuKxriI6Ik0iLCLFgyI6Ik4iLCLFhyI6Ik4iLCLFhSI6Ik4iLCLhuYoiOiJOIiwi4bmEIjoiTiIsIuG5hiI6Ik4iLCLHuCI6Ik4iLCLGnSI6Ik4iLCLhuYgiOiJOIiwiyKAiOiJOIiwix4siOiJOIiwiw5EiOiJOIiwix4oiOiJOSiIsIsOTIjoiTyIsIsWOIjoiTyIsIseRIjoiTyIsIsOUIjoiTyIsIuG7kCI6Ik8iLCLhu5giOiJPIiwi4buSIjoiTyIsIuG7lCI6Ik8iLCLhu5YiOiJPIiwiw5YiOiJPIiwiyKoiOiJPIiwiyK4iOiJPIiwiyLAiOiJPIiwi4buMIjoiTyIsIsWQIjoiTyIsIsiMIjoiTyIsIsOSIjoiTyIsIuG7jiI6Ik8iLCLGoCI6Ik8iLCLhu5oiOiJPIiwi4buiIjoiTyIsIuG7nCI6Ik8iLCLhu54iOiJPIiwi4bugIjoiTyIsIsiOIjoiTyIsIuqdiiI6Ik8iLCLqnYwiOiJPIiwixYwiOiJPIiwi4bmSIjoiTyIsIuG5kCI6Ik8iLCLGnyI6Ik8iLCLHqiI6Ik8iLCLHrCI6Ik8iLCLDmCI6Ik8iLCLHviI6Ik8iLCLDlSI6Ik8iLCLhuYwiOiJPIiwi4bmOIjoiTyIsIsisIjoiTyIsIsaiIjoiT0kiLCLqnY4iOiJPTyIsIsaQIjoiRSIsIsaGIjoiTyIsIsiiIjoiT1UiLCLhuZQiOiJQIiwi4bmWIjoiUCIsIuqdkiI6IlAiLCLGpCI6IlAiLCLqnZQiOiJQIiwi4rGjIjoiUCIsIuqdkCI6IlAiLCLqnZgiOiJRIiwi6p2WIjoiUSIsIsWUIjoiUiIsIsWYIjoiUiIsIsWWIjoiUiIsIuG5mCI6IlIiLCLhuZoiOiJSIiwi4bmcIjoiUiIsIsiQIjoiUiIsIsiSIjoiUiIsIuG5niI6IlIiLCLJjCI6IlIiLCLisaQiOiJSIiwi6py+IjoiQyIsIsaOIjoiRSIsIsWaIjoiUyIsIuG5pCI6IlMiLCLFoCI6IlMiLCLhuaYiOiJTIiwixZ4iOiJTIiwixZwiOiJTIiwiyJgiOiJTIiwi4bmgIjoiUyIsIuG5oiI6IlMiLCLhuagiOiJTIiwixaQiOiJUIiwixaIiOiJUIiwi4bmwIjoiVCIsIsiaIjoiVCIsIsi+IjoiVCIsIuG5qiI6IlQiLCLhuawiOiJUIiwixqwiOiJUIiwi4bmuIjoiVCIsIsauIjoiVCIsIsWmIjoiVCIsIuKxryI6IkEiLCLqnoAiOiJMIiwixpwiOiJNIiwiyYUiOiJWIiwi6pyoIjoiVFoiLCLDmiI6IlUiLCLFrCI6IlUiLCLHkyI6IlUiLCLDmyI6IlUiLCLhubYiOiJVIiwiw5wiOiJVIiwix5ciOiJVIiwix5kiOiJVIiwix5siOiJVIiwix5UiOiJVIiwi4bmyIjoiVSIsIuG7pCI6IlUiLCLFsCI6IlUiLCLIlCI6IlUiLCLDmSI6IlUiLCLhu6YiOiJVIiwixq8iOiJVIiwi4buoIjoiVSIsIuG7sCI6IlUiLCLhu6oiOiJVIiwi4busIjoiVSIsIuG7riI6IlUiLCLIliI6IlUiLCLFqiI6IlUiLCLhuboiOiJVIiwixbIiOiJVIiwixa4iOiJVIiwixagiOiJVIiwi4bm4IjoiVSIsIuG5tCI6IlUiLCLqnZ4iOiJWIiwi4bm+IjoiViIsIsayIjoiViIsIuG5vCI6IlYiLCLqnaAiOiJWWSIsIuG6giI6IlciLCLFtCI6IlciLCLhuoQiOiJXIiwi4bqGIjoiVyIsIuG6iCI6IlciLCLhuoAiOiJXIiwi4rGyIjoiVyIsIuG6jCI6IlgiLCLhuooiOiJYIiwiw50iOiJZIiwixbYiOiJZIiwixbgiOiJZIiwi4bqOIjoiWSIsIuG7tCI6IlkiLCLhu7IiOiJZIiwixrMiOiJZIiwi4bu2IjoiWSIsIuG7viI6IlkiLCLIsiI6IlkiLCLJjiI6IlkiLCLhu7giOiJZIiwixbkiOiJaIiwixb0iOiJaIiwi4bqQIjoiWiIsIuKxqyI6IloiLCLFuyI6IloiLCLhupIiOiJaIiwiyKQiOiJaIiwi4bqUIjoiWiIsIsa1IjoiWiIsIsSyIjoiSUoiLCLFkiI6Ik9FIiwi4bSAIjoiQSIsIuG0gSI6IkFFIiwiypkiOiJCIiwi4bSDIjoiQiIsIuG0hCI6IkMiLCLhtIUiOiJEIiwi4bSHIjoiRSIsIuqcsCI6IkYiLCLJoiI6IkciLCLKmyI6IkciLCLKnCI6IkgiLCLJqiI6IkkiLCLKgSI6IlIiLCLhtIoiOiJKIiwi4bSLIjoiSyIsIsqfIjoiTCIsIuG0jCI6IkwiLCLhtI0iOiJNIiwiybQiOiJOIiwi4bSPIjoiTyIsIsm2IjoiT0UiLCLhtJAiOiJPIiwi4bSVIjoiT1UiLCLhtJgiOiJQIiwiyoAiOiJSIiwi4bSOIjoiTiIsIuG0mSI6IlIiLCLqnLEiOiJTIiwi4bSbIjoiVCIsIuKxuyI6IkUiLCLhtJoiOiJSIiwi4bScIjoiVSIsIuG0oCI6IlYiLCLhtKEiOiJXIiwiyo8iOiJZIiwi4bSiIjoiWiIsIsOhIjoiYSIsIsSDIjoiYSIsIuG6ryI6ImEiLCLhurciOiJhIiwi4bqxIjoiYSIsIuG6syI6ImEiLCLhurUiOiJhIiwix44iOiJhIiwiw6IiOiJhIiwi4bqlIjoiYSIsIuG6rSI6ImEiLCLhuqciOiJhIiwi4bqpIjoiYSIsIuG6qyI6ImEiLCLDpCI6ImEiLCLHnyI6ImEiLCLIpyI6ImEiLCLHoSI6ImEiLCLhuqEiOiJhIiwiyIEiOiJhIiwiw6AiOiJhIiwi4bqjIjoiYSIsIsiDIjoiYSIsIsSBIjoiYSIsIsSFIjoiYSIsIuG2jyI6ImEiLCLhupoiOiJhIiwiw6UiOiJhIiwix7siOiJhIiwi4biBIjoiYSIsIuKxpSI6ImEiLCLDoyI6ImEiLCLqnLMiOiJhYSIsIsOmIjoiYWUiLCLHvSI6ImFlIiwix6MiOiJhZSIsIuqctSI6ImFvIiwi6py3IjoiYXUiLCLqnLkiOiJhdiIsIuqcuyI6ImF2Iiwi6py9IjoiYXkiLCLhuIMiOiJiIiwi4biFIjoiYiIsIsmTIjoiYiIsIuG4hyI6ImIiLCLhtawiOiJiIiwi4baAIjoiYiIsIsaAIjoiYiIsIsaDIjoiYiIsIsm1IjoibyIsIsSHIjoiYyIsIsSNIjoiYyIsIsOnIjoiYyIsIuG4iSI6ImMiLCLEiSI6ImMiLCLJlSI6ImMiLCLEiyI6ImMiLCLGiCI6ImMiLCLIvCI6ImMiLCLEjyI6ImQiLCLhuJEiOiJkIiwi4biTIjoiZCIsIsihIjoiZCIsIuG4iyI6ImQiLCLhuI0iOiJkIiwiyZciOiJkIiwi4baRIjoiZCIsIuG4jyI6ImQiLCLhta0iOiJkIiwi4baBIjoiZCIsIsSRIjoiZCIsIsmWIjoiZCIsIsaMIjoiZCIsIsSxIjoiaSIsIsi3IjoiaiIsIsmfIjoiaiIsIsqEIjoiaiIsIsezIjoiZHoiLCLHhiI6ImR6Iiwiw6kiOiJlIiwixJUiOiJlIiwixJsiOiJlIiwiyKkiOiJlIiwi4bidIjoiZSIsIsOqIjoiZSIsIuG6vyI6ImUiLCLhu4ciOiJlIiwi4buBIjoiZSIsIuG7gyI6ImUiLCLhu4UiOiJlIiwi4biZIjoiZSIsIsOrIjoiZSIsIsSXIjoiZSIsIuG6uSI6ImUiLCLIhSI6ImUiLCLDqCI6ImUiLCLhursiOiJlIiwiyIciOiJlIiwixJMiOiJlIiwi4biXIjoiZSIsIuG4lSI6ImUiLCLisbgiOiJlIiwixJkiOiJlIiwi4baSIjoiZSIsIsmHIjoiZSIsIuG6vSI6ImUiLCLhuJsiOiJlIiwi6p2rIjoiZXQiLCLhuJ8iOiJmIiwixpIiOiJmIiwi4bWuIjoiZiIsIuG2giI6ImYiLCLHtSI6ImciLCLEnyI6ImciLCLHpyI6ImciLCLEoyI6ImciLCLEnSI6ImciLCLEoSI6ImciLCLJoCI6ImciLCLhuKEiOiJnIiwi4baDIjoiZyIsIselIjoiZyIsIuG4qyI6ImgiLCLInyI6ImgiLCLhuKkiOiJoIiwixKUiOiJoIiwi4rGoIjoiaCIsIuG4pyI6ImgiLCLhuKMiOiJoIiwi4bilIjoiaCIsIsmmIjoiaCIsIuG6liI6ImgiLCLEpyI6ImgiLCLGlSI6Imh2Iiwiw60iOiJpIiwixK0iOiJpIiwix5AiOiJpIiwiw64iOiJpIiwiw68iOiJpIiwi4bivIjoiaSIsIuG7iyI6ImkiLCLIiSI6ImkiLCLDrCI6ImkiLCLhu4kiOiJpIiwiyIsiOiJpIiwixKsiOiJpIiwixK8iOiJpIiwi4baWIjoiaSIsIsmoIjoiaSIsIsSpIjoiaSIsIuG4rSI6ImkiLCLqnboiOiJkIiwi6p28IjoiZiIsIuG1uSI6ImciLCLqnoMiOiJyIiwi6p6FIjoicyIsIuqehyI6InQiLCLqna0iOiJpcyIsIsewIjoiaiIsIsS1IjoiaiIsIsqdIjoiaiIsIsmJIjoiaiIsIuG4sSI6ImsiLCLHqSI6ImsiLCLEtyI6ImsiLCLisaoiOiJrIiwi6p2DIjoiayIsIuG4syI6ImsiLCLGmSI6ImsiLCLhuLUiOiJrIiwi4baEIjoiayIsIuqdgSI6ImsiLCLqnYUiOiJrIiwixLoiOiJsIiwixpoiOiJsIiwiyawiOiJsIiwixL4iOiJsIiwixLwiOiJsIiwi4bi9IjoibCIsIsi0IjoibCIsIuG4tyI6ImwiLCLhuLkiOiJsIiwi4rGhIjoibCIsIuqdiSI6ImwiLCLhuLsiOiJsIiwixYAiOiJsIiwiyasiOiJsIiwi4baFIjoibCIsIsmtIjoibCIsIsWCIjoibCIsIseJIjoibGoiLCLFvyI6InMiLCLhupwiOiJzIiwi4bqbIjoicyIsIuG6nSI6InMiLCLhuL8iOiJtIiwi4bmBIjoibSIsIuG5gyI6Im0iLCLJsSI6Im0iLCLhta8iOiJtIiwi4baGIjoibSIsIsWEIjoibiIsIsWIIjoibiIsIsWGIjoibiIsIuG5iyI6Im4iLCLItSI6Im4iLCLhuYUiOiJuIiwi4bmHIjoibiIsIse5IjoibiIsIsmyIjoibiIsIuG5iSI6Im4iLCLGniI6Im4iLCLhtbAiOiJuIiwi4baHIjoibiIsIsmzIjoibiIsIsOxIjoibiIsIseMIjoibmoiLCLDsyI6Im8iLCLFjyI6Im8iLCLHkiI6Im8iLCLDtCI6Im8iLCLhu5EiOiJvIiwi4buZIjoibyIsIuG7kyI6Im8iLCLhu5UiOiJvIiwi4buXIjoibyIsIsO2IjoibyIsIsirIjoibyIsIsivIjoibyIsIsixIjoibyIsIuG7jSI6Im8iLCLFkSI6Im8iLCLIjSI6Im8iLCLDsiI6Im8iLCLhu48iOiJvIiwixqEiOiJvIiwi4bubIjoibyIsIuG7oyI6Im8iLCLhu50iOiJvIiwi4bufIjoibyIsIuG7oSI6Im8iLCLIjyI6Im8iLCLqnYsiOiJvIiwi6p2NIjoibyIsIuKxuiI6Im8iLCLFjSI6Im8iLCLhuZMiOiJvIiwi4bmRIjoibyIsIserIjoibyIsIsetIjoibyIsIsO4IjoibyIsIse/IjoibyIsIsO1IjoibyIsIuG5jSI6Im8iLCLhuY8iOiJvIiwiyK0iOiJvIiwixqMiOiJvaSIsIuqdjyI6Im9vIiwiyZsiOiJlIiwi4baTIjoiZSIsIsmUIjoibyIsIuG2lyI6Im8iLCLIoyI6Im91Iiwi4bmVIjoicCIsIuG5lyI6InAiLCLqnZMiOiJwIiwixqUiOiJwIiwi4bWxIjoicCIsIuG2iCI6InAiLCLqnZUiOiJwIiwi4bW9IjoicCIsIuqdkSI6InAiLCLqnZkiOiJxIiwiyqAiOiJxIiwiyYsiOiJxIiwi6p2XIjoicSIsIsWVIjoiciIsIsWZIjoiciIsIsWXIjoiciIsIuG5mSI6InIiLCLhuZsiOiJyIiwi4bmdIjoiciIsIsiRIjoiciIsIsm+IjoiciIsIuG1syI6InIiLCLIkyI6InIiLCLhuZ8iOiJyIiwiybwiOiJyIiwi4bWyIjoiciIsIuG2iSI6InIiLCLJjSI6InIiLCLJvSI6InIiLCLihoQiOiJjIiwi6py/IjoiYyIsIsmYIjoiZSIsIsm/IjoiciIsIsWbIjoicyIsIuG5pSI6InMiLCLFoSI6InMiLCLhuaciOiJzIiwixZ8iOiJzIiwixZ0iOiJzIiwiyJkiOiJzIiwi4bmhIjoicyIsIuG5oyI6InMiLCLhuakiOiJzIiwiyoIiOiJzIiwi4bW0IjoicyIsIuG2iiI6InMiLCLIvyI6InMiLCLJoSI6ImciLCLhtJEiOiJvIiwi4bSTIjoibyIsIuG0nSI6InUiLCLFpSI6InQiLCLFoyI6InQiLCLhubEiOiJ0IiwiyJsiOiJ0IiwiyLYiOiJ0Iiwi4bqXIjoidCIsIuKxpiI6InQiLCLhuasiOiJ0Iiwi4bmtIjoidCIsIsatIjoidCIsIuG5ryI6InQiLCLhtbUiOiJ0IiwixqsiOiJ0IiwiyogiOiJ0IiwixaciOiJ0Iiwi4bW6IjoidGgiLCLJkCI6ImEiLCLhtIIiOiJhZSIsIsedIjoiZSIsIuG1tyI6ImciLCLJpSI6ImgiLCLKriI6ImgiLCLKryI6ImgiLCLhtIkiOiJpIiwiyp4iOiJrIiwi6p6BIjoibCIsIsmvIjoibSIsIsmwIjoibSIsIuG0lCI6Im9lIiwiybkiOiJyIiwiybsiOiJyIiwiyboiOiJyIiwi4rG5IjoiciIsIsqHIjoidCIsIsqMIjoidiIsIsqNIjoidyIsIsqOIjoieSIsIuqcqSI6InR6Iiwiw7oiOiJ1Iiwixa0iOiJ1Iiwix5QiOiJ1Iiwiw7siOiJ1Iiwi4bm3IjoidSIsIsO8IjoidSIsIseYIjoidSIsIseaIjoidSIsIsecIjoidSIsIseWIjoidSIsIuG5syI6InUiLCLhu6UiOiJ1IiwixbEiOiJ1IiwiyJUiOiJ1Iiwiw7kiOiJ1Iiwi4bunIjoidSIsIsawIjoidSIsIuG7qSI6InUiLCLhu7EiOiJ1Iiwi4burIjoidSIsIuG7rSI6InUiLCLhu68iOiJ1IiwiyJciOiJ1IiwixasiOiJ1Iiwi4bm7IjoidSIsIsWzIjoidSIsIuG2mSI6InUiLCLFryI6InUiLCLFqSI6InUiLCLhubkiOiJ1Iiwi4bm1IjoidSIsIuG1qyI6InVlIiwi6p24IjoidW0iLCLisbQiOiJ2Iiwi6p2fIjoidiIsIuG5vyI6InYiLCLKiyI6InYiLCLhtowiOiJ2Iiwi4rGxIjoidiIsIuG5vSI6InYiLCLqnaEiOiJ2eSIsIuG6gyI6InciLCLFtSI6InciLCLhuoUiOiJ3Iiwi4bqHIjoidyIsIuG6iSI6InciLCLhuoEiOiJ3Iiwi4rGzIjoidyIsIuG6mCI6InciLCLhuo0iOiJ4Iiwi4bqLIjoieCIsIuG2jSI6IngiLCLDvSI6InkiLCLFtyI6InkiLCLDvyI6InkiLCLhuo8iOiJ5Iiwi4bu1IjoieSIsIuG7syI6InkiLCLGtCI6InkiLCLhu7ciOiJ5Iiwi4bu/IjoieSIsIsizIjoieSIsIuG6mSI6InkiLCLJjyI6InkiLCLhu7kiOiJ5IiwixboiOiJ6Iiwixb4iOiJ6Iiwi4bqRIjoieiIsIsqRIjoieiIsIuKxrCI6InoiLCLFvCI6InoiLCLhupMiOiJ6IiwiyKUiOiJ6Iiwi4bqVIjoieiIsIuG1tiI6InoiLCLhto4iOiJ6IiwiypAiOiJ6IiwixrYiOiJ6IiwiyYAiOiJ6Iiwi76yAIjoiZmYiLCLvrIMiOiJmZmkiLCLvrIQiOiJmZmwiLCLvrIEiOiJmaSIsIu+sgiI6ImZsIiwixLMiOiJpaiIsIsWTIjoib2UiLCLvrIYiOiJzdCIsIuKCkCI6ImEiLCLigpEiOiJlIiwi4bWiIjoiaSIsIuKxvCI6ImoiLCLigpIiOiJvIiwi4bWjIjoiciIsIuG1pCI6InUiLCLhtaUiOiJ2Iiwi4oKTIjoieCJ9";
    var Latinise = {};
    Latinise.latin_map = JSON.parse(decodeURIComponent(escape(atob(base64map))));
    String.prototype.latinise = function() {
        return this.replace(/[^A-Za-z0-9\[\] ]/g, function(a) {
            return Latinise.latin_map[a] || a;
        });
    };
    String.prototype.latinize = String.prototype.latinise;
    String.prototype.isLatin = function() {
        return this == this.latinise();
    };
    String.prototype.normalise = function() {
        return this.latinise().replace('ue', 'u').replace('oe', 'o').replace('ae', 'a');
    };
    /**
     * Backbone filter. This adds a filtering mechanism similar to Django ORM
     * filters:
     *
     * var MyModel = Backbone.Model.extend(...); var model = new MyModel(...);
     * model.filter("somekey", "somevalue"); model.filter("anotherkey",
     * "anothervalue"); Doing so will result in the query() method to return a
     * query string of all filters:
     *
     * somekey=somevalue&anotherkey=anothervalue
     *
     * Note that if the key is an instance of Backbone.Model you can take
     * another model as the key and the query() method will translate this to
     * get the id attribute as the value and the Model's name as the key, e.g.
     *
     * var MyModel = Backbone.Model.extend(...); var User =
     * Backbone.Model.extend({ ..., asFilter : 'user', ...}); var model = new
     * MyModel(...); var user = new User({id : 1})).fetch(); model.filter(user);
     * model.query(); => user=1
     *
     * To clear the filter use model.clearFilter() To check if a model is
     * filtered use model.filtered() To get the actual filter key/value pairs,
     * use model.getFilter()
     *
     * .qryFilter() calls can be chained, e.g.
     * model.qryFilter(...).qryFilter(...);
     *
     * Notes: (1) for this to work, the Model must specify the asFilter
     * attribute. asFilter can be a value or a function. (2) the get('id') call
     * to get the key value of the filter is called by filter() not by query().
     * If you want to override this, pass a function, which will be evaluated by
     * query(), that is possibly much later then the filter is defined. Use this
     * if you want the filter to adapt dynamically. (3) the filter is only
     * applied on the next fetch() call (!) and it only affects the server side
     * filter, i.e. it does not interfer with the find and findWhere methods of
     * Backbone collections.
     *
     * Use the query() function to construct the URL:
     *
     * ... url : function() { return this.urlRoot + "?" + this.query(); } ...
     */
    var QueryFilter = {
        /**
         * add a filter
         *
         * @param key
         *            string or instance of a Backbone.Model
         * @param value
         *            string or function. functions are evaluated at query()
         *            time
         * @param op
         *            undefined or Django tastypie operator
         * @return this for chainable calls
         * @memberOf QueryFilter
         */
        qryFilter : function(key, value, op) {
            this._qryfilters = this._qryfilters || {};
            if ( key instanceof $B.Model) {
                value = _.isFunction(value) ? value : key.get('id');
                key = _.isFunction(key.asFilter) ? key.asFilter() : key.asFilter;
            }
            // store filter as eg.
            // ['attribute__gte'] = value
            // ['attribute'] = value
            // (tastypie / django query syntax)
            this._qryfilters[key + ( op ? '__' + op : '')] = value;
            return this;
        },
        /**
         * clear all filters. Note this does not affect the current state of the
         * model, it only takes effect upon the next sync() call
         */
        clearQryFilter : function() {
            this._qryfilters = {};
            return this;
        },
        /**
         * returns true if one or more filters have been applied false otherwise
         */
        qryFiltered : function() {
            return this.keys(_qryfilters).length > 0;
        },
        /**
         * return the current set of filters as a dictionary of key/value pairs
         */
        getQryFilter : function() {
            return this._qryfilters();
        },
        /**
         * dict of filters, value can be a function or a string: { key : value,
         * key2 : function() { ... } } Note: by default, this is null and gets
         * allocated on the first filter() call. Rationale: if we initialized to {}
         * here, every object would have the same filter. Keeping it null by
         * default ensures only object-specific filters are used.
         */
        _qryfilters : null,
        /**
         * return the URL's query string. This method used by the default url()
         * (see tastypie.js)
         *
         * Note this will serialize certain object types(e.g. dates). See
         * serialize() for details.
         *
         * @return filters as term=value&term2=value2
         */
        query : function() {
            // create the list of filters as key value pair
            var queryfilters = [];
            for (var key in this._qryfilters || {}) {
                // get value
                var value = _.isFunction(this._qryfilters[key]) ? this._qryfilters[key](this) : this._qryfilters[key];
                // add value as a serialized object
                queryfilters.push("{0}={1}".format([key, this.serialize(value)]));
            };
            // return the query string
            return queryfilters.join('&');
        },
        /**
         * convert specific types to their query-string equivalent
         */
        serialize : function(value) {
            if ( value instanceof Date) {
                value = value.toISOString();
            }
            return encodeURIComponent(value);
        }
    };
    _.extend($B.Model.prototype, QueryFilter);
    _.extend($B.Model.prototype, {
        related : {}
    });
    _.extend($B.Collection.prototype, QueryFilter);
    /**
     * Activity Tracker. Apply the activity tracker to track calls to DOM events
     * that indicate user activity, and can thus tell when the last activity has
     * happened.
     */
    var activityTracker = {
        /**
         * default last activity is whenever we're instantiated
         */
        lastActivity : new Date(),
        /**
         * setup the activity tracker. This will bind the events provided, or
         * the click keydown keyup and mousemove events by default.
         */
        setup : function(events) {
            events = events || "click keydown keyup mousemove";
            // install activity tracker
            $(document).bind(events, this.trackActivity());
            this.lastActivity = new Date();
        },
        /**
         * remember last activity. We need this to determine if we should react
         * to a beacon event
         *
         * @param {Object}
         *            e
         */
        trackActivity : function(e) {
            this.lastActivity = new Date();
        },
        /**
         * returns the milliseconds since the last activity
         *
         * @param {Object}
         *            e
         */
        noActivityFor : function(e) {
            return new Date().getTime() - this.lastActivity.getTime();
        }
    };
    util.activityTracker = activityTracker;
    /**
     * return current position as per the device's geolocation, and reverse
     * geocode the address into it
     */
    util.getCurrentPosition = function() {
        // @see
        // https://github.com/apache/cordova-plugin-geolocation/blob/master/doc/index.md
        var promise = $.Deferred();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                // success
                var geocoder = new GeoCoder();
                var result = geocoder.reverse(pos.coords.latitude, pos.coords.longitude);
                result.done(function(data) {
                    pos.address = data['address'];
                    promise.resolve(pos);
                });

            });
        } else {
            promise.fail('no geolocation service on this device');
        }
        return promise.promise();
    };
    // generic time updater
    util.startTimeUpdate = function(selector, seconds) {
        var interval = 1000 * (seconds || 60);
        var updateCurrentDateTime = function() {
            var current = moment().format('DD.MM.YYYY - HH:mm');
            $(selector).html(current);
        };
        // run once just now...
        setTimeout(updateCurrentDateTime, 1);
        // .. then start at most one timer
        app.timeUpdateInterval && clearInterval(app.timeUpdateInterval);
        app.timeUpdateInterval = setInterval(updateCurrentDateTime, interval);
    };
    // generic app settings update
    // update with stored remote settings, if any
    /**
     * update the settings object with remote overrides
     *
     * this is to enable server overrides of some application settings see
     * main/getAppSettings where we get the remote app settings, if any
     */
    util.updateAppSettings = function() {
        var appsettings = window.localStorage.getItem('appsettings');
        if (appsettings) {
            var origsettings = $.extend({}, settings);
            $.extend(settings, JSON.parse(appsettings) || {});
            console.debug('new settings with applied updates');
        }
        util.safeAppRestart(origsettings);
    };
    var pingRetry = 5;
    /**
     * try to ping the server and restart if it does not respond
     *
     * this tries to restart at most pingRetry times. It uses the origin
     * application settings as a fallback. Note that in process a new settings
     * object will again be retrieved, causing the next retry to fail etc. Since
     * we don't reload the app, merely restart it, there is no danger of
     */
    util.safeAppRestart = function(origsettings) {
        require(['models/appsettings'], function(AppSettings) {
            // ping to see if new settings work. if not revert updates
            new AppSettings().ping().fail(function() {
                console.debug('new settings failed to ping - reverting');
                window.localStorage.removeItem('appsettings');
                window.localStorage.removeItem('apppatch');
                $.extend(settings, origsettings);
                if (pingRetry--) {
                    // setTimeout(app.start(), 100);
                } else {
                    alert("Error connecting to server. Try later.");
                }
            }).done(function() {
                // only execute patch if the server connection actually
                // works
                var apppatch = window.localStorage.getItem('apppatch');
                if (apppatch && settings.allowRemotePatch) {
                    try {
                        $('body').append('<script>(function() { {0}; })();</script>'.format([apppatch]));
                    } catch (e) {
                        console.debug('error during patch function execution');
                    }
                }
            });
        });
    };
    /**
     * collection some device data
     */
    util.getDeviceData = function() {
        return {
            device : {
                model : device.name || '*',
                platform : device.platform || '*',
                cordova : device.cordova || '*',
                version : device.version || '*',
                // anonyminize the device id -- sha1 is a one-way hash
                // so server can't figure out the real id from this.
                uuid : new sha1(device.uuid || 'unknown', 'TEXT').getHash('SHA-1', 'HEX'),
            },
            app : {
                variant : app.settings.variant,
                version : app.settings.version || '*',
            }
        };
    };
    /**
     * geo location coordination
     *
     * no geocoding
     */
    util.getPositionCoordinates = function() {
        // @see
        // https://github.com/apache/cordova-plugin-geolocation/blob/master/doc/index.md
        var promise = $.Deferred();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                promise.resolve({
                    lat : pos.coords.latitude,
                    lon : pos.coords.longitude,
                });
            });
        } else {
            promise.reject('no geolocation service on this device');
        }
        return promise.promise();
    };
    util.sha1 = sha1;
    return util;
});
