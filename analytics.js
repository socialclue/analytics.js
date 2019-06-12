

if (typeof Influence === 'undefined') {
    /**
     * Constructs a new Influence  Analytics tracker.
     *
     * @constructor Influence
     *
     * @param options.tracker   The tracker to use for tracking events.
     *                          Must be: function(collection, event).
     *
     */
    var Influence = function(options) {
        if (!(this instanceof Influence)) return new Influence(config);
        /**
         * New InfluenceTracker()
         * @type {{tracker}|{}}
         */
        checkCampaignActive(options.trackingId, (err, res) => {

            if(err)
                return;
            if(res.isActive) {

                tracker = new InfluenceTracker(options.trackingId);

                /**
                 * New InfluenceNotification()
                 * @type {{Notifications}}
                 */
                var notificationTimmer = setInterval( function () {
                    if ( document.readyState !== 'complete' ) return;
                    notifications = new Notifications(options.trackingId);
                    this.notificationsInstance = notifications;
                    clearInterval( notificationTimmer );
                }, 100 );

                options = options || {};

                this.options    = options;

                this.trackerInstance    = tracker;

                this.initialize();
            }
        });
    };

    (function(Influence) {
        Influence.prototype.options = function() {
            return this.options;
        };

        // Browser Detection
        var BrowserDetect = (function() {
            var BrowserDetect = {
                init: function () {
                    this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
                    this.version = this.searchVersion(navigator.userAgent) ||
                        this.searchVersion(navigator.appVersion) ||
                        "an unknown version";
                    this.OS = this.searchString(this.dataOS) || "an unknown OS";
                },
                searchString: function (data) {
                    for (var i=0;i<data.length;i++) {
                        var dataString = data[i].string;
                        var dataProp = data[i].prop;
                        this.versionSearchString = data[i].versionSearch || data[i].identity;
                        if (dataString) {
                            if (dataString.indexOf(data[i].subString) != -1)
                                return data[i].identity;
                        }
                        else if (dataProp)
                            return data[i].identity;
                    }
                },
                searchVersion: function (dataString) {
                    var index = dataString.indexOf(this.versionSearchString);
                    if (index == -1) return;
                    return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
                },
                dataBrowser: [
                    {
                        string: navigator.userAgent,
                        subString: "Chrome",
                        identity: "Chrome"
                    },
                    {   string: navigator.userAgent,
                        subString: "OmniWeb",
                        versionSearch: "OmniWeb/",
                        identity: "OmniWeb"
                    },
                    {
                        string: navigator.vendor,
                        subString: "Apple",
                        identity: "Safari",
                        versionSearch: "Version"
                    },
                    {
                        prop: window.opera,
                        identity: "Opera",
                        versionSearch: "Version"
                    },
                    {
                        string: navigator.vendor,
                        subString: "iCab",
                        identity: "iCab"
                    },
                    {
                        string: navigator.vendor,
                        subString: "KDE",
                        identity: "Konqueror"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "Firefox",
                        identity: "Firefox"
                    },
                    {
                        string: navigator.vendor,
                        subString: "Camino",
                        identity: "Camino"
                    },
                    {   // for newer Netscapes (6+)
                        string: navigator.userAgent,
                        subString: "Netscape",
                        identity: "Netscape"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "MSIE",
                        identity: "Explorer",
                        versionSearch: "MSIE"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "Gecko",
                        identity: "Mozilla",
                        versionSearch: "rv"
                    },
                    {     // for older Netscapes (4-)
                        string: navigator.userAgent,
                        subString: "Mozilla",
                        identity: "Netscape",
                        versionSearch: "Mozilla"
                    }
                ],
                dataOS : [
                    {
                        string: navigator.platform,
                        subString: "Win",
                        identity: "Windows"
                    },
                    {
                        string: navigator.platform,
                        subString: "Mac",
                        identity: "Mac"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "iPod",
                        identity: "iPod"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "iPad",
                        identity: "iPad"
                    },
                    {
                        string: navigator.userAgent,
                        subString: "iPhone",
                        identity: "iPhone"
                    },
                    {
                        string: navigator.platform,
                        subString: "Linux",
                        identity: "Linux"
                    }
                ]

            };
            BrowserDetect.init();
            return BrowserDetect;})();

        var Geo = {};

        Geo.geoip = function(success, failure) {
            httpGetAsync('https://extreme-ip-lookup.com/json', (res) => {
                response = JSON.parse(res);
                if(response)
                    success({
                        latitude:   response.lat,
                        longitude:  response.lon,
                        city: response.city,
                        country: response.country,
                        ip: response.query
                    });
                else
                    failure;
            });
        };

        var Util = {};

        Util.copyFields = function(source, target) {
            var createDelegate = function(source, value) {
                return function() {
                    return value.apply(source, arguments);
                };
            };

            target = target || {};

            var key, value;

            for (key in source) {
                if (! /layerX|Y/.test(key)) {
                    value = source[key];

                    if (typeof value === 'function') {
                        // Bind functions to object being copied (???):
                        target[key] = createDelegate(source, value);
                    } else {
                        target[key] = value;
                    }
                }
            }

            return target;
        };

        Util.merge = function(o1, o2) {
            var r, key, index;
            if (o1 === undefined) return o1;
            else if (o2 === undefined) return o1;
            else if (o1 instanceof Array && o2 instanceof Array) {
                r = [];
                // Copy
                for (index = 0; index < o1.length; index++) {
                    r.push(o1[index]);
                }
                // Merge
                for (index = 0; index < o2.length; index++) {
                    if (r.length > index) {
                        r[index] = Util.merge(r[index], o2[index]);
                    } else {
                        r.push(o2[index]);
                    }
                }
                return r;
            } else if (o1 instanceof Object && o2 instanceof Object) {
                r = {};
                // Copy:
                for (key in o1) {
                    r[key] = o1[key];
                }
                // Merge:
                for (key in o2) {
                    if (r[key] !== undefined) {
                        r[key] = Util.merge(r[key], o2[key]);
                    } else {
                        r[key] = o2[key];
                    }
                }
                return r;
            } else {
                return o2;
            }
        };

        Util.toObject = function(olike) {
            var o = {}, key;

            for (key in olike) {
                o[key] = olike[key];
            }

            return o;
        };

        Util.genGuid = function() {
            var s4 = function() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            };

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };

        Util.parseQueryString = function(qs) {
            var pairs = {};

            if (qs.length > 0) {
                var query = qs.charAt(0) === '?' ? qs.substring(1) : qs;

                if (query.length > 0) {
                    var vars = query.split('&');
                    for (var i = 0; i < vars.length; i++) {
                        if (vars[i].length > 0) {
                            var pair = vars[i].split('=');

                            try {
                                var name = decodeURIComponent(pair[0]);
                                var value = (pair.length > 1) ? decodeURIComponent(pair[1]) : 'true';

                                pairs[name] = value;
                            } catch (e) { }
                        }
                    }
                }
            }
            return pairs;
        };

        Util.unparseQueryString = function(qs) {
            var kvs = [], k, v;
            for (k in qs) {
                if (!qs.hasOwnProperty || qs.hasOwnProperty(k)) {
                    v = qs[k];

                    kvs.push(
                        encodeURIComponent(k) + '=' + encodeURIComponent(v)
                    );
                }
            }
            var string = kvs.join('&');

            if (string.length > 0) return '?' + string;
            else return '';
        };

        Util.size = function(v) {
            if (v === undefined) return 0;
            else if (v instanceof Array) return v.length;
            else if (v instanceof Object) {
                var size = 0;
                for (var key in v) {
                    if (!v.hasOwnProperty || v.hasOwnProperty(key)) ++size;
                }
                return size;
            } else return 1;
        };

        Util.mapJson = function(v, f) {
            var vp, vv;
            if (v instanceof Array) {
                vp = [];
                for (var i = 0; i < v.length; i++) {
                    vv = Util.mapJson(v[i], f);

                    if (Util.size(vv) > 0) vp.push(vv);
                }
                return vp;
            } else if (v instanceof Object) {
                vp = {};
                for (var k in v) {
                    vv = Util.mapJson(v[k], f);

                    if (Util.size(vv) > 0) vp[k] = vv;
                }
                return vp;
            } else return f(v);
        };

        Util.jsonify = function(v) {
            return Util.mapJson(v, function(v) {
                if (v === '') return undefined;
                else {
                    var r;
                    try {
                        r = JSON.parse(v);
                    } catch (e) {
                        r = v;
                    }

                    return r;
                }
            });
        };

        Util.undup = function(f, cutoff) {
            cutoff = cutoff || 250;

            var lastInvoked = 0;
            return function() {
                var curTime = (new Date()).getTime();
                var delta = curTime - lastInvoked;

                if (delta > cutoff) {
                    lastInvoked = curTime;

                    return f.apply(this, arguments);
                } else {
                    return undefined;
                }
            };
        };

        Util.parseUrl = function(url) {
            var l = document.createElement("a");
            l.href = url;
            if (l.host === '') {
                l.href = l.href;
            }
            return {
                hash:     l.hash,
                host:     l.host,
                hostname: l.hostname,
                pathname: l.pathname,
                protocol: l.protocol,
                query:    Util.parseQueryString(l.search)
            };
        };

        Util.unparseUrl = function(url) {
            return (url.protocol || '') +
                '//' +
                (url.host || '') +
                (url.pathname || '') +
                Util.unparseQueryString(url.query) +
                (url.hash || '');
        };

        Util.equals = function(v1, v2) {
            var leftEqualsObject = function(o1, o2) {
                for (var k in o1) {
                    if (!o1.hasOwnProperty || o1.hasOwnProperty(k)) {
                        if (!Util.equals(o1[k], o2[k])) return false;
                    }
                }
                return true;
            };

            if (v1 instanceof Array) {
                if (v2 instanceof Array) {
                    if (v1.length !== v2.length) return false;

                    for (var i = 0; i < v1.length; i++) {
                        if (!Util.equals(v1[i], v2[i])) {
                            return false;
                        }
                    }

                    return true;
                } else {
                    return false;
                }
            } else if (v1 instanceof Object) {
                if (v2 instanceof Object) {
                    return leftEqualsObject(v1, v2) && leftEqualsObject(v2, v1);
                } else {
                    return false;
                }
            } else {
                return v1 === v2;
            }
        };

        Util.isSamePage = function(url1, url2) {
            url1 = url1 instanceof String ? Util.parseUrl(url1) : url1;
            url2 = url2 instanceof String ? Util.parseUrl(url2) : url2;

            // Ignore the hash when comparing to see if two pages represent the same resource:
            return url1.protocol === url2.protocol &&
                url1.host     === url2.host &&
                url1.pathname === url2.pathname &&
                Util.equals(url1.query, url2.query);
        };

        Util.qualifyUrl = function(url) {
            var escapeHTML = function(s) {
                return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
            };

            var el= document.createElement('div');
            el.innerHTML= '<a href="'+escapeHTML(url)+'">x</a>';
            return el.firstChild.href;
        };

        Util.padLeft = function(n, p, c) {
            var pad_char = typeof c !== 'undefined' ? c : '0';
            var pad = new Array(1 + p).join(pad_char);
            return (pad + n).slice(-pad.length);
        };

        var DomUtil = {};

        DomUtil.getFormData = function(node) {
            var acc = {};

            var setField = function(name, value) {
                if (name === '') name = 'anonymous';

                var oldValue = acc[name];

                if (oldValue != null) {
                    if (oldValue instanceof Array) {
                        acc[name].push(value);
                    } else {
                        acc[name] = [oldValue, value];
                    }
                } else {
                    acc[name] = value;
                }
            };

            for (var i = 0; i < node.elements.length; i++) {
                var child = node.elements[i];
                var nodeType = child.tagName.toLowerCase();

                if (nodeType == 'input' || nodeType == 'textfield') {
                    // INPUT or TEXTFIELD element.
                    // Make sure auto-complete is not turned off for the field:
                    if ((child.getAttribute('autocomplete') || '').toLowerCase() !== 'off') {
                        // Make sure it's not a password:
                        if (child.type !== 'password') {
                            // Make sure it's not a radio or it's a checked radio:
                            if (child.type !== 'radio' || child.checked) {
                                setField(child.name, child.value);
                            }
                        }
                    }
                } else if (nodeType == 'select') {
                    // SELECT element:
                    var option = child.options[child.selectedIndex];

                    setField(child.name, option.value);
                }
            }

            return acc;
        };

        DomUtil.monitorElements = function(tagName, onnew, refresh) {
            refresh = refresh || 50;

            var checker = function() {
                var curElements = document.getElementsByTagName(tagName);

                for (var i = 0; i < curElements.length; i++) {
                    var el = curElements[i];

                    var scanned = el.getAttribute('influence_scanned');

                    if (!scanned) {
                        el.setAttribute('influence_scanned', true);
                        try {
                            onnew(el);
                        } catch (e) {
                            window.onerror(e);
                        }
                    }
                }

                setTimeout(checker, refresh);
            };

            setTimeout(checker, 0);
        };

        DomUtil.getDataset = function(node) {
            if (typeof node.dataset !== 'undefined') {
                return Util.toObject(node.dataset);
            } else if (node.attributes) {
                var dataset = {};

                var attrs = node.attributes;

                for (var i = 0; i < attrs.length; i++) {
                    var name = attrs[i].name;
                    var value = attrs[i].value;

                    if (name.indexOf('data-') === 0) {
                        name = name.substr('data-'.length);

                        dataset[name] = value;
                    }
                }

                return dataset;
            } else return {};
        };


        DomUtil.genCssSelector = function(node) {
            var sel = '';

            while (node != document.body) {
                var id = node.id;
                var classes = typeof node.className === 'string' ?
                    node.className.trim().split(/\s+/).join(".") : '';
                var tagName = node.nodeName.toLowerCase();

                if (id && id !== "") id = '#' + id;
                if (classes !== "") classes = '.' + classes;

                var prefix = tagName + id + classes;

                var parent = node.parentNode;

                var nthchild = 1;

                for (var i = 0; i < parent.childNodes.length; i++) {
                    if (parent.childNodes[i] === node) break;
                    else {
                        var childTagName = parent.childNodes[i].tagName;
                        if (childTagName !== undefined) {
                            nthchild = nthchild + 1;
                        }
                    }
                }

                if (sel !== '') sel = '>' + sel;

                sel = prefix + ':nth-child(' + nthchild + ')' + sel;

                node = parent;
            }

            return sel;
        };

        DomUtil.getNodeDescriptor = function(node) {
            return {
                id:         node.id,
                selector:   DomUtil.genCssSelector(node),
                title:      node.title === '' ? undefined : node.title,
                data:       DomUtil.getDataset(node)
            };
        };

        DomUtil.getAncestors = function(node) {
            var cur = node;
            var result = [];

            while (cur && cur !== document.body) {
                result.push(cur);
                cur = cur.parentNode;
            }

            return result;
        };

        DomUtil.simulateMouseEvent = function(element, eventName, options) {
            var eventMatchers = {
                'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
                'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
            };

            options = Util.merge({
                pointerX: 0,
                pointerY: 0,
                button: 0,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                bubbles: true,
                cancelable: true
            }, options || {});

            var oEvent, eventType = null;

            for (var name in eventMatchers) {
                if (eventMatchers[name].test(eventName)) { eventType = name; break; }
            }

            if (!eventType) throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

            if (document.createEvent) {
                oEvent = document.createEvent(eventType);
                if (eventType === 'HTMLEvents') {
                    oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                } else {
                    oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                        options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element
                    );
                }
                element.dispatchEvent(oEvent);
            } else {
                options.clientX = options.pointerX;
                options.clientY = options.pointerY;
                var evt = document.createEventObject();
                oEvent = Util.merge(evt, options);
                try {
                    element.fireEvent('on' + eventName, oEvent);
                } catch (error) {
                    // IE nonsense:
                    element.fireEvent('on' + eventName);
                }
            }
            return element;
        };

        var ArrayUtil = {};

        ArrayUtil.removeElement = function(array, from, to) {
            var tail = array.slice((to || from) + 1 || array.length);
            array.length = from < 0 ? array.length + from : from;
            return array.push.apply(array, tail);
        };

        ArrayUtil.toArray = function(alike) {
            var arr = [], i, len = alike.length;

            arr.length = alike.length;

            for (i = 0; i < len; i++) {
                arr[i] = alike[i];
            }

            return arr;
        };

        ArrayUtil.contains = function(array, el) {
            return ArrayUtil.exists(array, function(e){return e === el;});
        };

        ArrayUtil.diff = function(arr1, arr2) {
            var i, el, diff = [];
            for (i = 0; i < arr1.length; i++) {
                el = arr1[i];

                if (!ArrayUtil.contains(arr2, el)) diff.push(el);
            }
            return diff;
        };

        ArrayUtil.exists = function(array, f) {
            for (var i = 0; i < array.length; i++) {
                if (f(array[i])) return true;
            }
            return false;
        };

        ArrayUtil.map = function(array, f) {
            var r = [], i;
            for (i = 0; i < array.length; i++) {
                r.push(f(array[i]));
            }
            return r;
        };

        var Env = {};

        Env.getFingerprint = function() {
            var data = [
                JSON.stringify(Env.getPluginsData()),
                JSON.stringify(Env.getLocaleData()),
                navigator.userAgent.toString()
            ];

            return MD5.hash(data.join(""));
        };

        Env.getBrowserData = function() {
            var fingerprint = Env.getFingerprint();

            return ({
                ua:           navigator.userAgent,
                name:         BrowserDetect.browser,
                version:      BrowserDetect.version,
                platform:     BrowserDetect.OS,
                language:     navigator.language || navigator.userLanguage || navigator.systemLanguage,
                plugins:      Env.getPluginsData()
            });
        };

        Env.getUrlData = function() {
            var l = document.location;
            return ({
                hash:     l.hash,
                host:     l.host,
                hostname: l.hostname,
                pathname: l.pathname,
                protocol: l.protocol,
                query:    Util.parseQueryString(l.search)
            });
        };

        Env.getDocumentData = function() {
            return ({
                title:    document.title,
                referrer: document.referrer && Util.parseUrl(document.referrer) || undefined,
                url:      Env.getUrlData()
            });
        };

        Env.getScreenData = function() {
            return ({
                height: screen.height,
                width: screen.width,
                colorDepth: screen.colorDepth
            });
        };

        Env.getLocaleData = function() {
            // "Mon Apr 15 2013 12:21:35 GMT-0600 (MDT)"
            //
            var results = new RegExp('([A-Z]+-[0-9]+) \\(([A-Z]+)\\)').exec((new Date()).toString());

            var gmtOffset, timezone;

            if (results && results.length >= 3) {
                gmtOffset = results[1];
                timezone  = results[2];
            }

            return ({
                language: navigator.systemLanguage || navigator.userLanguage || navigator.language,
                timezoneOffset: (new Date()).getTimezoneOffset(),
                gmtOffset: gmtOffset,
                timezone:  timezone
            });
        };

        Env.getPageloadData = function() {
            var l = document.location;
            return {
                browser:  Env.getBrowserData(),
                document: Env.getDocumentData(),
                screen:   Env.getScreenData(),
                locale:   Env.getLocaleData()
            };
        };

        Env.getPluginsData = function() {
            var plugins = [];
            var p = navigator.plugins;
            for (var i = 0; i < p.length; i++) {
                var pi = p[i];
                plugins.push({
                    name:         pi.name,
                    description:  pi.description,
                    filename:     pi.filename,
                    version:      pi.version,
                    mimeType: (pi.length > 0) ? ({
                        type:         pi[0].type,
                        description:  pi[0].description,
                        suffixes:     pi[0].suffixes
                    }) : undefined
                });
            }
            return plugins;
        };

        var Handler = function() {
            this.handlers = [];
            this.onerror = (console && console.log) || window.onerror || (function(e) {});
        };

        Handler.prototype.push = function(f) {
            this.handlers.push(f);
        };

        Handler.prototype.dispatch = function() {
            var args = Array.prototype.slice.call(arguments, 0), i;

            for (i = 0; i < this.handlers.length; i++) {
                try {
                    this.handlers[i].apply(null, args);
                }
                catch (e) {
                    onerror(e);
                }
            }
        };

        var Events = {};

        Events.onready = function(f) {
            if (document.body != null) f();
            else setTimeout(function(){Events.onready(f);}, 10);
        };

        Events.onevent = function(el, type, capture, f_) {
            var fixup = function(f) {
                return function(e) {
                    if (!e) e = window.event;

                    // Perform a shallow clone (Firefox bugs):
                    e = Util.copyFields(e);

                    e.target    = e.target || e.srcElement;
                    e.keyCode   = e.keyCode || e.which || e.charCode;
                    e.which     = e.which || e.keyCode;
                    e.charCode  = (typeof e.which === "number") ? e.which : e.keyCode;
                    e.timeStamp = e.timeStamp || (new Date()).getTime();

                    if (e.target && e.target.nodeType == 3) e.target = e.target.parentNode;

                    var retVal;

                    if (!e.preventDefault) {
                        e.preventDefault = function() {
                            retVal = false;
                        };
                    }

                    return f(e) || retVal;
                };
            };

            var f = fixup(f_);

            if (el.addEventListener) {
                el.addEventListener(type, f, capture);
            } else if (el.attachEvent)  {
                el.attachEvent('on' + type, f);
            }
        };

        Events.onexit = (function() {
            var unloaded = false;

            var handler = new Handler();

            var handleUnload = function(e) {
                if (!unloaded) {
                    handler.dispatch(e);
                    unloaded = true;
                }
            };

            Events.onevent(window, 'unload', undefined, handleUnload);

            var replaceUnloader = function(obj) {
                var oldUnloader = obj.onunload || (function(e) {});

                obj.onunload = function(e) {
                    handleUnload();

                    oldUnloader(e);
                };
            };

            replaceUnloader(window);

            Events.onready(function() {
                replaceUnloader(document.body);
            });

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onengage = (function() {
            var handler = new Handler();
            var events = [];

            Events.onready(function() {
                Events.onevent(document.body, 'mouseover', true, function(e) {
                    events.push(e);
                });

                Events.onevent(document.body, 'mouseout', true, function(end) {
                    var i, start;

                    for (i = events.length - 1; i >= 0; i--) {
                        if (events[i].target === end.target) {
                            start = events[i];
                            ArrayUtil.removeElement(events, i);
                            break;
                        }
                    }

                    if (start !== undefined) {
                        var delta = (end.timeStamp - start.timeStamp);

                        if (delta >= 1000 && delta <= 20000) {
                            handler.dispatch(start, end);
                        }
                    }
                });
            });

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onhashchange = (function() {
            var handler = new Handler();
            var lastHash = document.location.hash;

            var dispatch = function(e) {
                var newHash = document.location.hash;

                if (lastHash != newHash) {
                    lastHash = newHash;

                    e.hash = newHash;

                    handler.dispatch(e);
                }
            };

            if (window.onhashchange) {
                Events.onevent(window, 'hashchange', false, dispatch);
            } else {
                setInterval(function() { dispatch({}); }, 25);
            }

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onerror = (function() {
            var handler = new Handler();

            if (typeof window.onerror === 'function') handler.push(window.onerror);

            window.onerror = function(err, url, line) { handler.dispatch(err, url, line); };

            return function(f) {
                handler.push(f);
            };
        })();

        Events.onsubmit = (function() {
            var handler = new Handler();

            var handle = Util.undup(function(e) {
                handler.dispatch(e);
            });

            Events.onready(function() {
                Events.onevent(document.body, 'submit', true, function(e) {
                    handle(e);
                });

                // Intercept enter keypresses which will submit the form in most browsers.
                Events.onevent(document.body, 'keypress', false, function(e) {
                    if (e.keyCode == 13) {
                        var target = e.target;
                        var form = target.form;

                        if (form) {
                            e.form = form;
                            handle(e);
                        }
                    }
                });

                // Intercept clicks on any buttons:
                Events.onevent(document.body, 'click', false, function(e) {
                    var target = e.target;
                    var targetType = (target.type || '').toLowerCase();

                    if (target.form && (targetType === 'submit' || targetType === 'button')) {
                        e.form = target.form;
                        handle(e);
                    }
                });
            });

            return function(f) {
                handler.push(f);
            };
        })();

        /**
         * Initializes Influence. This is called internally by the constructor and does
         * not need to be called manually.
         */
        Influence.prototype.initialize = function() {
            var self = this;
            var notificationPath = [];
            this.options = Util.merge({
                bucket:           'none',
                breakoutUsers:    false,
                breakoutVisitors: false,
                waitOnTracker:    false,
                resolveGeo:       true,
                trackPageViews:   true,
                trackClicks:      true,
                trackHashChanges: true,
                trackEngagement:  true ,
                trackLinkClicks:  true,
                trackRedirects:   true,
                trackSubmissions: true
            }, this.options);

            var rulesUrl = 'http://localhost:1337/rules/configuration/path/' + this.options.trackingId;
            httpGetAsync(rulesUrl, (res) => {
                response = JSON.parse(res);
                notificationPath = response.notificationPath;
                notificationPath = notificationPath.filter(notifPath => notifPath.type == 'lead');
                notificationPath = notificationPath.map(notifPath => notifPath.url);
            })

            // Always assume that Javascript is the culprit of leaving the page
            // (we'll detect and intercept clicks on links and buttons as best
            // as possible and override this assumption in these cases):
            this.javascriptRedirect = true;

            this.context = {};

            this.context.fingerprint = Env.getFingerprint();

            this.context.sessionId = (function() {
                var sessionId = sessionStorage.getItem('influence_sid') || Util.genGuid();

                sessionStorage.setItem('influence_sid', sessionId);

                return sessionId;
            })();

            function readCookie(name) {
                var key = name + "=";
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    while (cookie.charAt(0) === ' ') {
                        cookie = cookie.substring(1, cookie.length);
                    }
                    if (cookie.indexOf(key) === 0) {
                        return cookie.substring(key.length, cookie.length);
                    }
                }
                return null;
            }

            this.context.visitorId = (function() {
                var visitorId = readCookie('influence_vid');

                if(!visitorId) {
                    visitorId = Util.genGuid();
                    document.cookie = `influence_vid=${visitorId};`;
                }

                return visitorId;
            })();

            this.context.trackingId = this.options.trackingId;

            this.context.userId      = JSON.parse(localStorage.getItem('influence_uid')      || 'null');
            this.context.userProfile = JSON.parse(localStorage.getItem('influence_uprofile') || 'null');

            self.oldHash = document.location.hash;

            var trackJump = function(hash) {
                if (self.oldHash !== hash) { // Guard against tracking more than once
                    var id = hash.substring(1);

                    // If it's a real node, get it so we can capture node data:
                    var targetNode = document.getElementById(id);

                    var data = Util.merge({
                        url: Util.parseUrl(document.location)
                    }, targetNode ? DomUtil.getNodeDescriptor(targetNode) : {id: id});

                    self.track('jump', {
                        target: data,
                        source: {
                            url: Util.merge(Util.parseUrl(document.location), {
                                hash: self.oldHash // Override the hash
                            })
                        }
                    });

                    self.oldHash = hash;
                }
            };

            // Try to obtain geo location if possible:
            if(this.options.resolveGeo) {
                Geo.geoip(function(position) {
                    self.context.geo = position;
                });
            }

            // Track page view
            if(this.options.trackPageViews) {
                Events.onready(function() {
                    // Track page view, but only after the DOM has loaded:
                    self.pageview();
                });
            }

            // Track clicks
            if(this.options.trackClicks) {
                Events.onready(function() {
                    // Track all clicks to the document:
                    Events.onevent(document.body, 'click', true, function(e) {
                        var ancestors = DomUtil.getAncestors(e.target);

                        // Do not track clicks on links, these are tracked separately!
                        if (!ArrayUtil.exists(ancestors, function(e) { return e.tagName === 'A';})) {
                            self.track('click', {
                                target: DomUtil.getNodeDescriptor(e.target)
                            });
                        }
                    });
                });
            }

            // Track hash changes:
            if(this.options.trackHashChanges) {
                Events.onhashchange(function(e) {
                    trackJump(e.hash);
                });
            }

            //Set Tracking Id




            // Track all engagement:
            if(this.options.trackEngagement) {
                Events.onengage(function(start, end) {
                    self.track('engage', {
                        target:   DomUtil.getNodeDescriptor(start.target),
                        duration: end.timeStamp - start.timeStamp
                    });
                });
            }

            // Track all clicks on links:
            if(this.options.trackLinkClicks) {
                var that = this;
                DomUtil.monitorElements('a', function(el) {
                    Events.onevent(el, 'click', true, function(e) {
                        //return if this click it created with createEvent and not by a real click
                        if(!e.isTrusted) return;

                        var target = e.target;

                        // TODO: Make sure the link is actually to a page.
                        // It's a click, not a Javascript redirect:
                        self.javascriptRedirect = false;
                        setTimeout(function(){self.javascriptRedirect = true;}, 500);

                        var parsedUrl = Util.parseUrl(el.href);
                        var value = {target: Util.merge({url: parsedUrl}, DomUtil.getNodeDescriptor(target))};

                        if (Util.isSamePage(parsedUrl, document.location.href)) {
                            // User is jumping around the same page. Track here in case the
                            // client prevents the default action and the hash doesn't change
                            // (otherwise it would be tracked by onhashchange):
                            self.oldHash = undefined;

                            trackJump(document.location.hash);
                        } else if (parsedUrl.hostname === document.location.hostname) {
                            // We are linking to a page on the same site. There's no need to send
                            // the event now, we can safely send it later:
                            self.trackLater('click', value);
                        } else {
                            if(that.options.waitOnTracker) e.preventDefault();

                            // We are linking to a page that is not on this site. So we first
                            // wait to send the event before simulating a different click
                            // on the link. This ensures we don't lose the event if the user
                            // does not return to this site ever again.
                            self.track('click',
                                value,
                                function() {
                                    // It's a click, not a Javascript redirect:
                                    self.javascriptRedirect = false;

                                    // Simulate a click to the original element if we were waiting on the tracker:
                                    if(that.options.waitOnTracker) DomUtil.simulateMouseEvent(target, 'click');
                                }
                            );
                        }
                    });
                });
            }

            // Track JavaScript-based redirects, which can occur without warning:
            if(this.options.trackRedirects) {
                Events.onexit(function(e) {
                    if (self.javascriptRedirect) {
                        self.trackLater('redirect');
                    }
                });
            }

            // Track form submissions:
            if(this.options.trackSubmissions) {
                Events.onsubmit((e) => {
                    if (e.form) {
                        if (!e.form.formId) {
                            e.form.formId = Util.genGuid();
                        }
                        self.track('formsubmit', {
                            form: Util.merge({formId: e.form.formId}, DomUtil.getFormData(e.form))
                        });
                    }
                });
            }


            // Track form abandonments:


            // Load and send any pending events:
            this._loadOutbox();
            this._sendOutbox();
        };

        /**
         * Retrieves the path where a certain category of data is stored.
         *
         * @memberof Influence
         *
         * @param type  A simple String describing the category of data, such as
         *              'profile' or 'events'.
         */
        Influence.prototype.getPath = function(type) {
            var now = new Date();
            var rootNode =  this.context.userId ? (this.options.breakoutUsers ? '/users/' + this.context.userId + '/' : '/users/') :
                (this.options.breakoutVisitors ? '/visitors/' + this.context.visitorId + '/' : '/visitors/');
            var dateNode;

            if (/daily|day/.test(this.options.bucket)) {
                dateNode = now.getUTCFullYear() + '-' + Util.padLeft(now.getUTCMonth(), 2) + '-' + Util.padLeft(now.getUTCDate(), 2) + '/';
            } else if (/month/.test(this.options.bucket)) {
                dateNode = now.getUTCFullYear() + '-' + Util.padLeft(now.getUTCMonth(), 2) + '/';
            } else if (/year/.test(this.options.bucket)) {
                dateNode = now.getUTCFullYear() + '/';
            } else {
                dateNode = '';
            }

            var targetNode = type + '/';

            return rootNode + dateNode + targetNode;
        };

        Influence.prototype._saveOutbox = function() {
            localStorage.setItem('influence_outbox', JSON.stringify(this.outbox));
        };

        Influence.prototype._loadOutbox = function() {
            this.outbox = JSON.parse(localStorage.getItem('influence_outbox') || '[]');
        };

        Influence.prototype._sendOutbox = function() {
            for (var i = 0; i < this.outbox.length; i++) {
                var message = this.outbox[i];

                var event = message.value.event;

                // Specially modify redirect, formSubmit events to save the new URL,
                // because the URL is not known at the time of the event:
                if (ArrayUtil.contains(['redirect', 'formSubmit'], event)) {
                    message.value.target = Util.jsonify(Util.merge(message.value.target || {}, {url: Util.parseUrl(document.location)}));
                }

                // If source and target urls are the same, change redirect events
                // to reload events:
                if (event === 'redirect') {
                    try {
                        // See if it's a redirect (= different url) or reload (= same url):
                        var sourceUrl = Util.unparseUrl(message.value.source.url);
                        var targetUrl = Util.unparseUrl(message.value.target.url);

                        if (sourceUrl === targetUrl) {
                            // It's a reload:
                            message.value.event = 'reload';
                        }
                    } catch (e) {
                        window.onerror && window.onerror(e);
                    }
                }

                try {
                    this.trackerInstance.tracker(message);
                } catch (e) {
                    // Don't let one bad apple spoil the batch.
                    window.onerror && window.onerror(e);
                }
            }
            this.outbox = [];
            this._saveOutbox();
        };

        /**
         * Identifies a user.
         *
         * @memberof Influence
         *
         * @param userId  The unique user id.
         * @param props   An arbitrary JSON object describing properties of the user.
         *
         */
        Influence.prototype.identify = function(userId, props, context, success, failure) {
            this.context.userId       = this.options.trackingId;
            this.context.userProfile  = props;

            localStorage.setItem('influence_uid',      JSON.stringify(userId));
            localStorage.setItem('influence_uprofile', JSON.stringify(props || {}));

            this.context = Util.merge(context || {}, this.context);

            this.trackerInstance.tracker({
                path:     this.getPath('profile'),
                value:    this._createEvent(undefined, props),
                op:       'replace',
                success:  success,
                failure:  failure
            });
        };

        /**
         * A utility function to create an event. Adds timestamp, stores the name
         * of the event and contextual data, and generates an idiomatic, trimmed
         * JSON objects that contains all event details.
         */
        Influence.prototype._createEvent = function(name, props) {
            props = props || {};

            props.timestamp = props.timestamp || (new Date()).toISOString();
            props.event     = name;
            props.source    = Util.merge({url: Util.parseUrl(document.location)}, props.source || {});

            return Util.jsonify(Util.merge(this.context, props));
        };

        /**
         * Tracks an event now.
         *
         * @memberof Influence
         *
         * @param name        The name of the event, such as 'downloaded trial'.
         * @param props       An arbitrary JSON object describing properties of the event.
         * @param callback    A function to call when the tracking is complete.
         *
         */
        Influence.prototype.track = function(name, props, success, failure) {
            this.trackerInstance.tracker({
                path:    this.getPath('events'),
                value:   this._createEvent(name, props),
                op:      'append',
                success: success,
                failure: failure
            });
        };

        /**
         * Tracks an event later. The event will only be tracked if the user visits
         * some page on the same domain that has Influence Analytics installed.
         *
         * This function is mainly useful when the user is leaving the page and
         * there is not enough time to capture some user behavior.
         *
         * @memberof Influence
         *
         * @param name        The name of the event, such as 'downloaded trial'.
         * @param props       An arbitrary JSON object describing properties of the event.
         *
         */
        Influence.prototype.trackLater = function(name, props) {
            this.outbox.push({
                path:    this.getPath('events'),
                value:   this._createEvent(name, props),
                op:      'append'
            });

            this._saveOutbox();
        };

        /**
         * Identifies the user as a member of some group.
         *
         * @memberof Influence
         *
         * @param groupId
         * @param props
         *
         */
        Influence.prototype.group = function(groupId, props, success, failure) {
            this.context.userGroupId      = groupId;
            this.context.userGroupProfile = props;

            this.context = Util.merge(context || {}, this.context);

            this.trackerInstance.tracker({
                path:     this.getPath('groups'),
                value:    this._createEvent(undefined, props),
                op:       'replace',
                success:  success,
                failure:  failure
            });
        };

        /**
         * Tracks a page view.
         *
         */
        Influence.prototype.pageview = function(url, success, failure) {
            url = url || document.location;

            this.track('pageview', Util.merge(Env.getPageloadData(), {url: Util.parseUrl(url + '')}), success, failure);
        };


        /**
         * MD5 Function
         */


        var MD5 = (typeof MD5 === 'undefined') ? {} : MD5;

        (function(MD5) {
            function md5cycle(x, k) {
                var a = x[0],
                    b = x[1],
                    c = x[2],
                    d = x[3];

                a = ff(a, b, c, d, k[0], 7, -680876936);
                d = ff(d, a, b, c, k[1], 12, -389564586);
                c = ff(c, d, a, b, k[2], 17, 606105819);
                b = ff(b, c, d, a, k[3], 22, -1044525330);
                a = ff(a, b, c, d, k[4], 7, -176418897);
                d = ff(d, a, b, c, k[5], 12, 1200080426);
                c = ff(c, d, a, b, k[6], 17, -1473231341);
                b = ff(b, c, d, a, k[7], 22, -45705983);
                a = ff(a, b, c, d, k[8], 7, 1770035416);
                d = ff(d, a, b, c, k[9], 12, -1958414417);
                c = ff(c, d, a, b, k[10], 17, -42063);
                b = ff(b, c, d, a, k[11], 22, -1990404162);
                a = ff(a, b, c, d, k[12], 7, 1804603682);
                d = ff(d, a, b, c, k[13], 12, -40341101);
                c = ff(c, d, a, b, k[14], 17, -1502002290);
                b = ff(b, c, d, a, k[15], 22, 1236535329);

                a = gg(a, b, c, d, k[1], 5, -165796510);
                d = gg(d, a, b, c, k[6], 9, -1069501632);
                c = gg(c, d, a, b, k[11], 14, 643717713);
                b = gg(b, c, d, a, k[0], 20, -373897302);
                a = gg(a, b, c, d, k[5], 5, -701558691);
                d = gg(d, a, b, c, k[10], 9, 38016083);
                c = gg(c, d, a, b, k[15], 14, -660478335);
                b = gg(b, c, d, a, k[4], 20, -405537848);
                a = gg(a, b, c, d, k[9], 5, 568446438);
                d = gg(d, a, b, c, k[14], 9, -1019803690);
                c = gg(c, d, a, b, k[3], 14, -187363961);
                b = gg(b, c, d, a, k[8], 20, 1163531501);
                a = gg(a, b, c, d, k[13], 5, -1444681467);
                d = gg(d, a, b, c, k[2], 9, -51403784);
                c = gg(c, d, a, b, k[7], 14, 1735328473);
                b = gg(b, c, d, a, k[12], 20, -1926607734);

                a = hh(a, b, c, d, k[5], 4, -378558);
                d = hh(d, a, b, c, k[8], 11, -2022574463);
                c = hh(c, d, a, b, k[11], 16, 1839030562);
                b = hh(b, c, d, a, k[14], 23, -35309556);
                a = hh(a, b, c, d, k[1], 4, -1530992060);
                d = hh(d, a, b, c, k[4], 11, 1272893353);
                c = hh(c, d, a, b, k[7], 16, -155497632);
                b = hh(b, c, d, a, k[10], 23, -1094730640);
                a = hh(a, b, c, d, k[13], 4, 681279174);
                d = hh(d, a, b, c, k[0], 11, -358537222);
                c = hh(c, d, a, b, k[3], 16, -722521979);
                b = hh(b, c, d, a, k[6], 23, 76029189);
                a = hh(a, b, c, d, k[9], 4, -640364487);
                d = hh(d, a, b, c, k[12], 11, -421815835);
                c = hh(c, d, a, b, k[15], 16, 530742520);
                b = hh(b, c, d, a, k[2], 23, -995338651);

                a = ii(a, b, c, d, k[0], 6, -198630844);
                d = ii(d, a, b, c, k[7], 10, 1126891415);
                c = ii(c, d, a, b, k[14], 15, -1416354905);
                b = ii(b, c, d, a, k[5], 21, -57434055);
                a = ii(a, b, c, d, k[12], 6, 1700485571);
                d = ii(d, a, b, c, k[3], 10, -1894986606);
                c = ii(c, d, a, b, k[10], 15, -1051523);
                b = ii(b, c, d, a, k[1], 21, -2054922799);
                a = ii(a, b, c, d, k[8], 6, 1873313359);
                d = ii(d, a, b, c, k[15], 10, -30611744);
                c = ii(c, d, a, b, k[6], 15, -1560198380);
                b = ii(b, c, d, a, k[13], 21, 1309151649);
                a = ii(a, b, c, d, k[4], 6, -145523070);
                d = ii(d, a, b, c, k[11], 10, -1120210379);
                c = ii(c, d, a, b, k[2], 15, 718787259);
                b = ii(b, c, d, a, k[9], 21, -343485551);

                x[0] = add32(a, x[0]);
                x[1] = add32(b, x[1]);
                x[2] = add32(c, x[2]);
                x[3] = add32(d, x[3]);

            }

            function cmn(q, a, b, x, s, t) {
                a = add32(add32(a, q), add32(x, t));
                return add32((a << s) | (a >>> (32 - s)), b);
            }

            function ff(a, b, c, d, x, s, t) {
                return cmn((b & c) | ((~b) & d), a, b, x, s, t);
            }

            function gg(a, b, c, d, x, s, t) {
                return cmn((b & d) | (c & (~d)), a, b, x, s, t);
            }

            function hh(a, b, c, d, x, s, t) {
                return cmn(b ^ c ^ d, a, b, x, s, t);
            }

            function ii(a, b, c, d, x, s, t) {
                return cmn(c ^ (b | (~d)), a, b, x, s, t);
            }

            function md51(s) {
                txt = '';
                var n = s.length,
                    state = [1732584193, -271733879, -1732584194, 271733878],
                    i;
                for (i = 64; i <= s.length; i += 64) {
                    md5cycle(state, md5blk(s.substring(i - 64, i)));
                }
                s = s.substring(i - 64);
                var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (i = 0; i < s.length; i++)
                    tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
                tail[i >> 2] |= 0x80 << ((i % 4) << 3);
                if (i > 55) {
                    md5cycle(state, tail);
                    for (i = 0; i < 16; i++) tail[i] = 0;
                }
                tail[14] = n * 8;
                md5cycle(state, tail);
                return state;
            }

            /* there needs to be support for Unicode here,
             * unless we pretend that we can redefine the MD-5
             * algorithm for multi-byte characters (perhaps
             * by adding every four 16-bit characters and
             * shortening the sum to 32 bits). Otherwise
             * I suggest performing MD-5 as if every character
             * was two bytes--e.g., 0040 0025 = @%--but then
             * how will an ordinary MD-5 sum be matched?
             * There is no way to standardize text to something
             * like UTF-8 before transformation; speed cost is
             * utterly prohibitive. The JavaScript standard
             * itself needs to look at this: it should start
             * providing access to strings as preformed UTF-8
             * 8-bit unsigned value arrays.
             */

            function md5blk(s) { /* I figured global was faster.   */
                var md5blks = [],
                    i; /* Andy King said do it this way. */
                for (i = 0; i < 64; i += 4) {
                    md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
                }
                return md5blks;
            }

            var hex_chr = '0123456789abcdef'.split('');

            function rhex(n) {
                var s = '',
                    j = 0;
                for (; j < 4; j++)
                    s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
                return s;
            }

            function hex(x) {
                for (var i = 0; i < x.length; i++)
                    x[i] = rhex(x[i]);
                return x.join('');
            }

            function md5(s) {
                return hex(md51(s));
            }

            /* this function is much faster,
            so if possible we use it. Some IEs
            are the only ones I know of that
            need the idiotic second function,
            generated by an if clause.  */

            function add32(a, b) {
                return (a + b) & 0xFFFFFFFF;
            }

            if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
                function add32(x, y) {
                    var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                    return (msw << 16) | (lsw & 0xFFFF);
                }
            }

            MD5.hash = md5;
        })(MD5);


        /**
         *
         * Date Function
         */

        // Date shim:
        if (!Date.prototype.toISOString ) {
            (function() {
                function pad(number) {
                    var r = String(number);
                    if ( r.length === 1 ) {
                        r = '0' + r;
                    }
                    return r;
                }

                Date.prototype.toISOString = function() {
                    return this.getUTCFullYear() +
                        '-' + pad( this.getUTCMonth() + 1 ) +
                        '-' + pad( this.getUTCDate() ) +
                        'T' + pad( this.getUTCHours() ) +
                        ':' + pad( this.getUTCMinutes() ) +
                        ':' + pad( this.getUTCSeconds() ) +
                        '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 ) +
                        'Z';
                };
            }());
        }

        /**
         * /** HTML5 sessionStorage
         * @build       2009-08-20 23:35:12
         * @author      Andrea Giammarchi
         * @license     Mit Style License
         * @project     http://code.google.com/p/sessionstorage/
         */if(typeof sessionStorage==="undefined"){(function(j){var k=j;try{while(k!==k.top){k=k.top}}catch(i){}var f=(function(e,n){return{decode:function(o,p){return this.encode(o,p)},encode:function(y,u){for(var p=y.length,w=u.length,o=[],x=[],v=0,s=0,r=0,q=0,t;v<256;++v){x[v]=v}for(v=0;v<256;++v){s=(s+(t=x[v])+y.charCodeAt(v%p))%256;x[v]=x[s];x[s]=t}for(s=0;r<w;++r){v=r%256;s=(s+(t=x[v]))%256;p=x[v]=x[s];x[s]=t;o[q++]=e(u.charCodeAt(r)^x[(p+t)%256])}return o.join("")},key:function(q){for(var p=0,o=[];p<q;++p){o[p]=e(1+((n()*255)<<0))}return o.join("")}}})(j.String.fromCharCode,j.Math.random);var a=(function(n){function o(r,q,p){this._i=(this._data=p||"").length;if(this._key=q){this._storage=r}else{this._storage={_key:r||""};this._key="_key"}}o.prototype.c=String.fromCharCode(1);o.prototype._c=".";o.prototype.clear=function(){this._storage[this._key]=this._data};o.prototype.del=function(p){var q=this.get(p);if(q!==null){this._storage[this._key]=this._storage[this._key].replace(e.call(this,p,q),"")}};o.prototype.escape=n.escape;o.prototype.get=function(q){var s=this._storage[this._key],t=this.c,p=s.indexOf(q=t.concat(this._c,this.escape(q),t,t),this._i),r=null;if(-1<p){p=s.indexOf(t,p+q.length-1)+1;r=s.substring(p,p=s.indexOf(t,p));r=this.unescape(s.substr(++p,r))}return r};o.prototype.key=function(){var u=this._storage[this._key],v=this.c,q=v+this._c,r=this._i,t=[],s=0,p=0;while(-1<(r=u.indexOf(q,r))){t[p++]=this.unescape(u.substring(r+=2,s=u.indexOf(v,r)));r=u.indexOf(v,s)+2;s=u.indexOf(v,r);r=1+s+1*u.substring(r,s)}return t};o.prototype.set=function(p,q){this.del(p);this._storage[this._key]+=e.call(this,p,q)};o.prototype.unescape=n.unescape;function e(p,q){var r=this.c;return r.concat(this._c,this.escape(p),r,r,(q=this.escape(q)).length,r,q)}return o})(j);if(Object.prototype.toString.call(j.opera)==="[object Opera]"){history.navigationMode="compatible";a.prototype.escape=j.encodeURIComponent;a.prototype.unescape=j.decodeURIComponent}function l(){function r(){s.cookie=["sessionStorage="+j.encodeURIComponent(h=f.key(128))].join(";");g=f.encode(h,g);a=new a(k,"name",k.name)}var e=k.name,s=k.document,n=/\bsessionStorage\b=([^;]+)(;|$)/,p=n.exec(s.cookie),q;if(p){h=j.decodeURIComponent(p[1]);g=f.encode(h,g);a=new a(k,"name");for(var t=a.key(),q=0,o=t.length,u={};q<o;++q){if((p=t[q]).indexOf(g)===0){b.push(p);u[p]=a.get(p);a.del(p)}}a=new a.constructor(k,"name",k.name);if(0<(this.length=b.length)){for(q=0,o=b.length,c=a.c,p=[];q<o;++q){p[q]=c.concat(a._c,a.escape(t=b[q]),c,c,(t=a.escape(u[t])).length,c,t)}k.name+=p.join("")}}else{r();if(!n.exec(s.cookie)){b=null}}}l.prototype={length:0,key:function(e){if(typeof e!=="number"||e<0||b.length<=e){throw"Invalid argument"}return b[e]},getItem:function(e){e=g+e;if(d.call(m,e)){return m[e]}var n=a.get(e);if(n!==null){n=m[e]=f.decode(h,n)}return n},setItem:function(e,n){this.removeItem(e);e=g+e;a.set(e,f.encode(h,m[e]=""+n));this.length=b.push(e)},removeItem:function(e){var n=a.get(e=g+e);if(n!==null){delete m[e];a.del(e);this.length=b.remove(e)}},clear:function(){a.clear();m={};b.length=0}};var g=k.document.domain,b=[],m={},d=m.hasOwnProperty,h;b.remove=function(n){var e=this.indexOf(n);if(-1<e){this.splice(e,1)}return this.length};if(!b.indexOf){b.indexOf=function(o){for(var e=0,n=this.length;e<n;++e){if(this[e]===o){return e}}return -1}}if(k.sessionStorage){l=function(){};l.prototype=k.sessionStorage}l=new l;if(b!==null){j.sessionStorage=l}})(window)};


        /*!
* Nodeunit
* https://github.com/caolan/nodeunit
* Copyright (c) 2010 Caolan McMahon
* MIT Licensed
*
* json2.js
* http://www.JSON.org/json2.js
* Public Domain.
* NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
*/
        nodeunit = (function(){
            /*
                http://www.JSON.org/json2.js
                2010-11-17

                Public Domain.

                NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

                See http://www.JSON.org/js.html


                This code should be minified before deployment.
                See http://javascript.crockford.com/jsmin.html

                USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
                NOT CONTROL.


                This file creates a global JSON object containing two methods: stringify
                and parse.

                    JSON.stringify(value, replacer, space)
                        value       any JavaScript value, usually an object or array.

                        replacer    an optional parameter that determines how object
                                    values are stringified for objects. It can be a
                                    function or an array of strings.

                        space       an optional parameter that specifies the indentation
                                    of nested structures. If it is omitted, the text will
                                    be packed without extra whitespace. If it is a number,
                                    it will specify the number of spaces to indent at each
                                    level. If it is a string (such as '\t' or '&nbsp;'),
                                    it contains the characters used to indent at each level.

                        This method produces a JSON text from a JavaScript value.

                        When an object value is found, if the object contains a toJSON
                        method, its toJSON method will be called and the result will be
                        stringified. A toJSON method does not serialize: it returns the
                        value represented by the name/value pair that should be serialized,
                        or undefined if nothing should be serialized. The toJSON method
                        will be passed the key associated with the value, and this will be
                        bound to the value

                        For example, this would serialize Dates as ISO strings.

                            Date.prototype.toJSON = function (key) {
                                function f(n) {
                                    // Format integers to have at least two digits.
                                    return n < 10 ? '0' + n : n;
                                }

                                return this.getUTCFullYear()   + '-' +
                                     f(this.getUTCMonth() + 1) + '-' +
                                     f(this.getUTCDate())      + 'T' +
                                     f(this.getUTCHours())     + ':' +
                                     f(this.getUTCMinutes())   + ':' +
                                     f(this.getUTCSeconds())   + 'Z';
                            };

                        You can provide an optional replacer method. It will be passed the
                        key and value of each member, with this bound to the containing
                        object. The value that is returned from your method will be
                        serialized. If your method returns undefined, then the member will
                        be excluded from the serialization.

                        If the replacer parameter is an array of strings, then it will be
                        used to select the members to be serialized. It filters the results
                        such that only members with keys listed in the replacer array are
                        stringified.

                        Values that do not have JSON representations, such as undefined or
                        functions, will not be serialized. Such values in objects will be
                        dropped; in arrays they will be replaced with null. You can use
                        a replacer function to replace those with JSON values.
                        JSON.stringify(undefined) returns undefined.

                        The optional space parameter produces a stringification of the
                        value that is filled with line breaks and indentation to make it
                        easier to read.

                        If the space parameter is a non-empty string, then that string will
                        be used for indentation. If the space parameter is a number, then
                        the indentation will be that many spaces.

                        Example:

                        text = JSON.stringify(['e', {pluribus: 'unum'}]);
                        // text is '["e",{"pluribus":"unum"}]'


                        text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
                        // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

                        text = JSON.stringify([new Date()], function (key, value) {
                            return this[key] instanceof Date ?
                                'Date(' + this[key] + ')' : value;
                        });
                        // text is '["Date(---current time---)"]'


                    JSON.parse(text, reviver)
                        This method parses a JSON text to produce an object or array.
                        It can throw a SyntaxError exception.

                        The optional reviver parameter is a function that can filter and
                        transform the results. It receives each of the keys and values,
                        and its return value is used instead of the original value.
                        If it returns what it received, then the structure is not modified.
                        If it returns undefined then the member is deleted.

                        Example:

                        // Parse the text. Values that look like ISO date strings will
                        // be converted to Date objects.

                        myData = JSON.parse(text, function (key, value) {
                            var a;
                            if (typeof value === 'string') {
                                a =
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                                if (a) {
                                    return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                                        +a[5], +a[6]));
                                }
                            }
                            return value;
                        });

                        myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                            var d;
                            if (typeof value === 'string' &&
                                    value.slice(0, 5) === 'Date(' &&
                                    value.slice(-1) === ')') {
                                d = new Date(value.slice(5, -1));
                                if (d) {
                                    return d;
                                }
                            }
                            return value;
                        });


                This is a reference implementation. You are free to copy, modify, or
                redistribute.
            */

            /*jslint evil: true, strict: false, regexp: false */

            /*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
                call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
                getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
                lastIndex, length, parse, prototype, push, replace, slice, stringify,
                test, toJSON, toString, valueOf
            */


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

            var JSON = {};

            (function () {
                "use strict";

                function f(n) {
                    // Format integers to have at least two digits.
                    return n < 10 ? '0' + n : n;
                }

                if (typeof Date.prototype.toJSON !== 'function') {

                    Date.prototype.toJSON = function (key) {

                        return isFinite(this.valueOf()) ?
                            this.getUTCFullYear()   + '-' +
                            f(this.getUTCMonth() + 1) + '-' +
                            f(this.getUTCDate())      + 'T' +
                            f(this.getUTCHours())     + ':' +
                            f(this.getUTCMinutes())   + ':' +
                            f(this.getUTCSeconds())   + 'Z' : null;
                    };

                    String.prototype.toJSON =
                        Number.prototype.toJSON =
                            Boolean.prototype.toJSON = function (key) {
                                return this.valueOf();
                            };
                }

                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    gap,
                    indent,
                    meta = {    // table of character substitutions
                        '\b': '\\b',
                        '\t': '\\t',
                        '\n': '\\n',
                        '\f': '\\f',
                        '\r': '\\r',
                        '"' : '\\"',
                        '\\': '\\\\'
                    },
                    rep;


                function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

                    escapable.lastIndex = 0;
                    return escapable.test(string) ?
                        '"' + string.replace(escapable, function (a) {
                            var c = meta[a];
                            return typeof c === 'string' ? c :
                                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                        }) + '"' :
                        '"' + string + '"';
                }


                function str(key, holder) {

// Produce a string from holder[key].

                    var i,          // The loop counter.
                        k,          // The member key.
                        v,          // The member value.
                        length,
                        mind = gap,
                        partial,
                        value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

                    if (value && typeof value === 'object' &&
                        typeof value.toJSON === 'function') {
                        value = value.toJSON(key);
                    }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

                    if (typeof rep === 'function') {
                        value = rep.call(holder, key, value);
                    }

// What happens next depends on the value's type.

                    switch (typeof value) {
                        case 'string':
                            return quote(value);

                        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

                            return isFinite(value) ? String(value) : 'null';

                        case 'boolean':
                        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

                            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

                        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

                            if (!value) {
                                return 'null';
                            }

// Make an array to hold the partial results of stringifying this object value.

                            gap += indent;
                            partial = [];

// Is the value an array?

                            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                                length = value.length;
                                for (i = 0; i < length; i += 1) {
                                    partial[i] = str(i, value) || 'null';
                                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                                v = partial.length === 0 ? '[]' :
                                    gap ? '[\n' + gap +
                                        partial.join(',\n' + gap) + '\n' +
                                        mind + ']' :
                                        '[' + partial.join(',') + ']';
                                gap = mind;
                                return v;
                            }

// If the replacer is an array, use it to select the members to be stringified.

                            if (rep && typeof rep === 'object') {
                                length = rep.length;
                                for (i = 0; i < length; i += 1) {
                                    k = rep[i];
                                    if (typeof k === 'string') {
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            } else {

// Otherwise, iterate through all of the keys in the object.

                                for (k in value) {
                                    if (Object.hasOwnProperty.call(value, k)) {
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

                            v = partial.length === 0 ? '{}' :
                                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                                    mind + '}' : '{' + partial.join(',') + '}';
                            gap = mind;
                            return v;
                    }
                }

// If the JSON object does not yet have a stringify method, give it one.

                if (typeof JSON.stringify !== 'function') {
                    JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

                        var i;
                        gap = '';
                        indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

                        if (typeof space === 'number') {
                            for (i = 0; i < space; i += 1) {
                                indent += ' ';
                            }

// If the space parameter is a string, it will be used as the indent string.

                        } else if (typeof space === 'string') {
                            indent = space;
                        }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

                        rep = replacer;
                        if (replacer && typeof replacer !== 'function' &&
                            (typeof replacer !== 'object' ||
                                typeof replacer.length !== 'number')) {
                            throw new Error('JSON.stringify');
                        }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

                        return str('', {'': value});
                    };
                }


// If the JSON object does not yet have a parse method, give it one.

                if (typeof JSON.parse !== 'function') {
                    JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

                        var j;

                        function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                            var k, v, value = holder[key];
                            if (value && typeof value === 'object') {
                                for (k in value) {
                                    if (Object.hasOwnProperty.call(value, k)) {
                                        v = walk(value, k);
                                        if (v !== undefined) {
                                            value[k] = v;
                                        } else {
                                            delete value[k];
                                        }
                                    }
                                }
                            }
                            return reviver.call(holder, key, value);
                        }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

                        text = String(text);
                        cx.lastIndex = 0;
                        if (cx.test(text)) {
                            text = text.replace(cx, function (a) {
                                return '\\u' +
                                    ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                            });
                        }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

                        if (/^[\],:{}\s]*$/
                                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                                    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                            j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                            return typeof reviver === 'function' ?
                                walk({'': j}, '') : j;
                        }

// If the text is not JSON parseable, then a SyntaxError is thrown.

                        throw new SyntaxError('JSON.parse');
                    };
                }
            }());
            var assert = this.assert = {};
            var types = {};
            var core = {};
            var nodeunit = {};
            var reporter = {};
            /*global setTimeout: false, console: false */
            (function () {

                var async = {};

                // global on the server, window in the browser
                var root = this,
                    previous_async = root.async;

                if (typeof module !== 'undefined' && module.exports) {
                    module.exports = async;
                }
                else {
                    root.async = async;
                }

                async.noConflict = function () {
                    root.async = previous_async;
                    return async;
                };

                //// cross-browser compatiblity functions ////

                var _forEach = function (arr, iterator) {
                    if (arr.forEach) {
                        return arr.forEach(iterator);
                    }
                    for (var i = 0; i < arr.length; i += 1) {
                        iterator(arr[i], i, arr);
                    }
                };

                var _map = function (arr, iterator) {
                    if (arr.map) {
                        return arr.map(iterator);
                    }
                    var results = [];
                    _forEach(arr, function (x, i, a) {
                        results.push(iterator(x, i, a));
                    });
                    return results;
                };

                var _reduce = function (arr, iterator, memo) {
                    if (arr.reduce) {
                        return arr.reduce(iterator, memo);
                    }
                    _forEach(arr, function (x, i, a) {
                        memo = iterator(memo, x, i, a);
                    });
                    return memo;
                };

                var _keys = function (obj) {
                    if (Object.keys) {
                        return Object.keys(obj);
                    }
                    var keys = [];
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k)) {
                            keys.push(k);
                        }
                    }
                    return keys;
                };

                var _indexOf = function (arr, item) {
                    if (arr.indexOf) {
                        return arr.indexOf(item);
                    }
                    for (var i = 0; i < arr.length; i += 1) {
                        if (arr[i] === item) {
                            return i;
                        }
                    }
                    return -1;
                };

                //// exported async module functions ////

                //// nextTick implementation with browser-compatible fallback ////
                if (typeof setImmediate === 'function') {
                    async.nextTick = function (fn) {
                        setImmediate(fn);
                    };
                }
                else if (typeof process !== 'undefined' && process.nextTick) {
                    async.nextTick = process.nextTick;
                }
                else {
                    async.nextTick = function (fn) {
                        setTimeout(fn, 0);
                    };
                }

                async.forEach = function (arr, iterator, callback) {
                    if (!arr.length) {
                        return callback();
                    }
                    var completed = 0;
                    _forEach(arr, function (x) {
                        iterator(x, function (err) {
                            if (err) {
                                callback(err);
                                callback = function () {};
                            }
                            else {
                                completed += 1;
                                if (completed === arr.length) {
                                    callback();
                                }
                            }
                        });
                    });
                };

                async.forEachSeries = function (arr, iterator, callback) {
                    if (!arr.length) {
                        return callback();
                    }
                    var completed = 0;
                    var iterate = function () {
                        iterator(arr[completed], function (err) {
                            if (err) {
                                callback(err);
                                callback = function () {};
                            }
                            else {
                                completed += 1;
                                if (completed === arr.length) {
                                    callback();
                                }
                                else {
                                    iterate();
                                }
                            }
                        });
                    };
                    iterate();
                };


                var doParallel = function (fn) {
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [async.forEach].concat(args));
                    };
                };
                var doSeries = function (fn) {
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        return fn.apply(null, [async.forEachSeries].concat(args));
                    };
                };


                var _asyncMap = function (eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function (x, i) {
                        return {index: i, value: x};
                    });
                    eachfn(arr, function (x, callback) {
                        iterator(x.value, function (err, v) {
                            results[x.index] = v;
                            callback(err);
                        });
                    }, function (err) {
                        callback(err, results);
                    });
                };
                async.map = doParallel(_asyncMap);
                async.mapSeries = doSeries(_asyncMap);


                // reduce only has a series version, as doing reduce in parallel won't
                // work in many situations.
                async.reduce = function (arr, memo, iterator, callback) {
                    async.forEachSeries(arr, function (x, callback) {
                        iterator(memo, x, function (err, v) {
                            memo = v;
                            callback(err);
                        });
                    }, function (err) {
                        callback(err, memo);
                    });
                };
                // inject alias
                async.inject = async.reduce;
                // foldl alias
                async.foldl = async.reduce;

                async.reduceRight = function (arr, memo, iterator, callback) {
                    var reversed = _map(arr, function (x) {
                        return x;
                    }).reverse();
                    async.reduce(reversed, memo, iterator, callback);
                };
                // foldr alias
                async.foldr = async.reduceRight;

                var _filter = function (eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function (x, i) {
                        return {index: i, value: x};
                    });
                    eachfn(arr, function (x, callback) {
                        iterator(x.value, function (v) {
                            if (v) {
                                results.push(x);
                            }
                            callback();
                        });
                    }, function (err) {
                        callback(_map(results.sort(function (a, b) {
                            return a.index - b.index;
                        }), function (x) {
                            return x.value;
                        }));
                    });
                };
                async.filter = doParallel(_filter);
                async.filterSeries = doSeries(_filter);
                // select alias
                async.select = async.filter;
                async.selectSeries = async.filterSeries;

                var _reject = function (eachfn, arr, iterator, callback) {
                    var results = [];
                    arr = _map(arr, function (x, i) {
                        return {index: i, value: x};
                    });
                    eachfn(arr, function (x, callback) {
                        iterator(x.value, function (v) {
                            if (!v) {
                                results.push(x);
                            }
                            callback();
                        });
                    }, function (err) {
                        callback(_map(results.sort(function (a, b) {
                            return a.index - b.index;
                        }), function (x) {
                            return x.value;
                        }));
                    });
                };
                async.reject = doParallel(_reject);
                async.rejectSeries = doSeries(_reject);

                var _detect = function (eachfn, arr, iterator, main_callback) {
                    eachfn(arr, function (x, callback) {
                        iterator(x, function (result) {
                            if (result) {
                                main_callback(x);
                            }
                            else {
                                callback();
                            }
                        });
                    }, function (err) {
                        main_callback();
                    });
                };
                async.detect = doParallel(_detect);
                async.detectSeries = doSeries(_detect);

                async.some = function (arr, iterator, main_callback) {
                    async.forEach(arr, function (x, callback) {
                        iterator(x, function (v) {
                            if (v) {
                                main_callback(true);
                                main_callback = function () {};
                            }
                            callback();
                        });
                    }, function (err) {
                        main_callback(false);
                    });
                };
                // any alias
                async.any = async.some;

                async.every = function (arr, iterator, main_callback) {
                    async.forEach(arr, function (x, callback) {
                        iterator(x, function (v) {
                            if (!v) {
                                main_callback(false);
                                main_callback = function () {};
                            }
                            callback();
                        });
                    }, function (err) {
                        main_callback(true);
                    });
                };
                // all alias
                async.all = async.every;

                async.sortBy = function (arr, iterator, callback) {
                    async.map(arr, function (x, callback) {
                        iterator(x, function (err, criteria) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                callback(null, {value: x, criteria: criteria});
                            }
                        });
                    }, function (err, results) {
                        if (err) {
                            return callback(err);
                        }
                        else {
                            var fn = function (left, right) {
                                var a = left.criteria, b = right.criteria;
                                return a < b ? -1 : a > b ? 1 : 0;
                            };
                            callback(null, _map(results.sort(fn), function (x) {
                                return x.value;
                            }));
                        }
                    });
                };

                async.auto = function (tasks, callback) {
                    callback = callback || function () {};
                    var keys = _keys(tasks);
                    if (!keys.length) {
                        return callback(null);
                    }

                    var completed = [];

                    var listeners = [];
                    var addListener = function (fn) {
                        listeners.unshift(fn);
                    };
                    var removeListener = function (fn) {
                        for (var i = 0; i < listeners.length; i += 1) {
                            if (listeners[i] === fn) {
                                listeners.splice(i, 1);
                                return;
                            }
                        }
                    };
                    var taskComplete = function () {
                        _forEach(listeners, function (fn) {
                            fn();
                        });
                    };

                    addListener(function () {
                        if (completed.length === keys.length) {
                            callback(null);
                        }
                    });

                    _forEach(keys, function (k) {
                        var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
                        var taskCallback = function (err) {
                            if (err) {
                                callback(err);
                                // stop subsequent errors hitting callback multiple times
                                callback = function () {};
                            }
                            else {
                                completed.push(k);
                                taskComplete();
                            }
                        };
                        var requires = task.slice(0, Math.abs(task.length - 1)) || [];
                        var ready = function () {
                            return _reduce(requires, function (a, x) {
                                return (a && _indexOf(completed, x) !== -1);
                            }, true);
                        };
                        if (ready()) {
                            task[task.length - 1](taskCallback);
                        }
                        else {
                            var listener = function () {
                                if (ready()) {
                                    removeListener(listener);
                                    task[task.length - 1](taskCallback);
                                }
                            };
                            addListener(listener);
                        }
                    });
                };

                async.waterfall = function (tasks, callback) {
                    if (!tasks.length) {
                        return callback();
                    }
                    callback = callback || function () {};
                    var wrapIterator = function (iterator) {
                        return function (err) {
                            if (err) {
                                callback(err);
                                callback = function () {};
                            }
                            else {
                                var args = Array.prototype.slice.call(arguments, 1);
                                var next = iterator.next();
                                if (next) {
                                    args.push(wrapIterator(next));
                                }
                                else {
                                    args.push(callback);
                                }
                                async.nextTick(function () {
                                    iterator.apply(null, args);
                                });
                            }
                        };
                    };
                    wrapIterator(async.iterator(tasks))();
                };

                async.parallel = function (tasks, callback) {
                    callback = callback || function () {};
                    if (tasks.constructor === Array) {
                        async.map(tasks, function (fn, callback) {
                            if (fn) {
                                fn(function (err) {
                                    var args = Array.prototype.slice.call(arguments, 1);
                                    if (args.length <= 1) {
                                        args = args[0];
                                    }
                                    callback.call(null, err, args || null);
                                });
                            }
                        }, callback);
                    }
                    else {
                        var results = {};
                        async.forEach(_keys(tasks), function (k, callback) {
                            tasks[k](function (err) {
                                var args = Array.prototype.slice.call(arguments, 1);
                                if (args.length <= 1) {
                                    args = args[0];
                                }
                                results[k] = args;
                                callback(err);
                            });
                        }, function (err) {
                            callback(err, results);
                        });
                    }
                };

                async.series = function (tasks, callback) {
                    callback = callback || function () {};
                    if (tasks.constructor === Array) {
                        async.mapSeries(tasks, function (fn, callback) {
                            if (fn) {
                                fn(function (err) {
                                    var args = Array.prototype.slice.call(arguments, 1);
                                    if (args.length <= 1) {
                                        args = args[0];
                                    }
                                    callback.call(null, err, args || null);
                                });
                            }
                        }, callback);
                    }
                    else {
                        var results = {};
                        async.forEachSeries(_keys(tasks), function (k, callback) {
                            tasks[k](function (err) {
                                var args = Array.prototype.slice.call(arguments, 1);
                                if (args.length <= 1) {
                                    args = args[0];
                                }
                                results[k] = args;
                                callback(err);
                            });
                        }, function (err) {
                            callback(err, results);
                        });
                    }
                };

                async.iterator = function (tasks) {
                    var makeCallback = function (index) {
                        var fn = function () {
                            if (tasks.length) {
                                tasks[index].apply(null, arguments);
                            }
                            return fn.next();
                        };
                        fn.next = function () {
                            return (index < tasks.length - 1) ? makeCallback(index + 1): null;
                        };
                        return fn;
                    };
                    return makeCallback(0);
                };

                async.apply = function (fn) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    return function () {
                        return fn.apply(
                            null, args.concat(Array.prototype.slice.call(arguments))
                        );
                    };
                };

                var _concat = function (eachfn, arr, fn, callback) {
                    var r = [];
                    eachfn(arr, function (x, cb) {
                        fn(x, function (err, y) {
                            r = r.concat(y || []);
                            cb(err);
                        });
                    }, function (err) {
                        callback(err, r);
                    });
                };
                async.concat = doParallel(_concat);
                async.concatSeries = doSeries(_concat);

                async.whilst = function (test, iterator, callback) {
                    if (test()) {
                        iterator(function (err) {
                            if (err) {
                                return callback(err);
                            }
                            async.whilst(test, iterator, callback);
                        });
                    }
                    else {
                        callback();
                    }
                };

                async.until = function (test, iterator, callback) {
                    if (!test()) {
                        iterator(function (err) {
                            if (err) {
                                return callback(err);
                            }
                            async.until(test, iterator, callback);
                        });
                    }
                    else {
                        callback();
                    }
                };

                async.queue = function (worker, concurrency) {
                    var workers = 0;
                    var tasks = [];
                    var q = {
                        concurrency: concurrency,
                        push: function (data, callback) {
                            tasks.push({data: data, callback: callback});
                            async.nextTick(q.process);
                        },
                        process: function () {
                            if (workers < q.concurrency && tasks.length) {
                                var task = tasks.splice(0, 1)[0];
                                workers += 1;
                                worker(task.data, function () {
                                    workers -= 1;
                                    if (task.callback) {
                                        task.callback.apply(task, arguments);
                                    }
                                    q.process();
                                });
                            }
                        },
                        length: function () {
                            return tasks.length;
                        }
                    };
                    return q;
                };

                var _console_fn = function (name) {
                    return function (fn) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        fn.apply(null, args.concat([function (err) {
                            var args = Array.prototype.slice.call(arguments, 1);
                            if (typeof console !== 'undefined') {
                                if (err) {
                                    if (console.error) {
                                        console.error(err);
                                    }
                                }
                                else if (console[name]) {
                                    _forEach(args, function (x) {
                                        console[name](x);
                                    });
                                }
                            }
                        }]));
                    };
                };
                async.log = _console_fn('log');
                async.dir = _console_fn('dir');
                /*async.info = _console_fn('info');
                async.warn = _console_fn('warn');
                async.error = _console_fn('error');*/

                async.memoize = function (fn, hasher) {
                    var memo = {};
                    hasher = hasher || function (x) {
                        return x;
                    };
                    return function () {
                        var args = Array.prototype.slice.call(arguments);
                        var callback = args.pop();
                        var key = hasher.apply(null, args);
                        if (key in memo) {
                            callback.apply(null, memo[key]);
                        }
                        else {
                            fn.apply(null, args.concat([function () {
                                memo[key] = arguments;
                                callback.apply(null, arguments);
                            }]));
                        }
                    };
                };

            }());
            (function(exports){
                /**
                 * This file is based on the node.js assert module, but with some small
                 * changes for browser-compatibility
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 */


                /**
                 * Added for browser compatibility
                 */

                var _keys = function(obj){
                    if(Object.keys) return Object.keys(obj);
                    if (typeof obj != 'object' && typeof obj != 'function') {
                        throw new TypeError('-');
                    }
                    var keys = [];
                    for(var k in obj){
                        if(obj.hasOwnProperty(k)) keys.push(k);
                    }
                    return keys;
                };



// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


                var pSlice = Array.prototype.slice;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

                var assert = exports;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({message: message, actual: actual, expected: expected})

                assert.AssertionError = function AssertionError (options) {
                    this.name = "AssertionError";
                    this.message = options.message;
                    this.actual = options.actual;
                    this.expected = options.expected;
                    this.operator = options.operator;
                    var stackStartFunction = options.stackStartFunction || fail;

                    if (Error.captureStackTrace) {
                        Error.captureStackTrace(this, stackStartFunction);
                    }
                };
// code from util.inherits in node
                assert.AssertionError.super_ = Error;


// EDITED FOR BROWSER COMPATIBILITY: replaced Object.create call
// TODO: test what effect this may have
                var ctor = function () { this.constructor = assert.AssertionError; };
                ctor.prototype = Error.prototype;
                assert.AssertionError.prototype = new ctor();


                assert.AssertionError.prototype.toString = function() {
                    if (this.message) {
                        return [this.name+":", this.message].join(' ');
                    } else {
                        return [ this.name+":"
                            , JSON.stringify(this.expected )
                            , this.operator
                            , JSON.stringify(this.actual)
                        ].join(" ");
                    }
                };

// assert.AssertionError instanceof Error

                assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

                function fail(actual, expected, message, operator, stackStartFunction) {
                    throw new assert.AssertionError({
                        message: message,
                        actual: actual,
                        expected: expected,
                        operator: operator,
                        stackStartFunction: stackStartFunction
                    });
                }

// EXTENSION! allows for well behaved errors defined elsewhere.
                assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

                assert.ok = function ok(value, message) {
                    if (!!!value) fail(value, true, message, "==", assert.ok);
                };

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

                assert.equal = function equal(actual, expected, message) {
                    if (actual != expected) fail(actual, expected, message, "==", assert.equal);
                };

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

                assert.notEqual = function notEqual(actual, expected, message) {
                    if (actual == expected) {
                        fail(actual, expected, message, "!=", assert.notEqual);
                    }
                };

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

                assert.deepEqual = function deepEqual(actual, expected, message) {
                    if (!_deepEqual(actual, expected)) {
                        fail(actual, expected, message, "deepEqual", assert.deepEqual);
                    }
                };

                var Buffer = null;
                if (typeof require !== 'undefined' && typeof process !== 'undefined') {
                    try {
                        Buffer = require('buffer').Buffer;
                    }
                    catch (e) {
                        // May be a CommonJS environment other than Node.js
                        Buffer = null;
                    }
                }

                function _deepEqual(actual, expected) {
                    // 7.1. All identical values are equivalent, as determined by ===.
                    if (actual === expected) {
                        return true;
                        // 7.2. If the expected value is a Date object, the actual value is
                        // equivalent if it is also a Date object that refers to the same time.
                    } else if (actual instanceof Date && expected instanceof Date) {
                        return actual.getTime() === expected.getTime();

                        // 7.2.1 If the expcted value is a RegExp object, the actual value is
                        // equivalent if it is also a RegExp object that refers to the same source and options
                    } else if (actual instanceof RegExp && expected instanceof RegExp) {
                        return actual.source === expected.source &&
                            actual.global === expected.global &&
                            actual.ignoreCase === expected.ignoreCase &&
                            actual.multiline === expected.multiline;

                    } else if (Buffer && actual instanceof Buffer && expected instanceof Buffer) {
                        return (function() {
                            var i, len;

                            for (i = 0, len = expected.length; i < len; i++) {
                                if (actual[i] !== expected[i]) {
                                    return false;
                                }
                            }
                            return actual.length === expected.length;
                        })();
                        // 7.3. Other pairs that do not both pass typeof value == "object",
                        // equivalence is determined by ==.
                    } else if (typeof actual != 'object' && typeof expected != 'object') {
                        return actual == expected;

                        // 7.4. For all other Object pairs, including Array objects, equivalence is
                        // determined by having the same number of owned properties (as verified
                        // with Object.prototype.hasOwnProperty.call), the same set of keys
                        // (although not necessarily the same order), equivalent values for every
                        // corresponding key, and an identical "prototype" property. Note: this
                        // accounts for both named and indexed properties on Arrays.
                    } else {
                        return objEquiv(actual, expected);
                    }
                }

                function isUndefinedOrNull (value) {
                    return value === null || value === undefined;
                }

                function isArguments (object) {
                    return Object.prototype.toString.call(object) == '[object Arguments]';
                }

                function objEquiv (a, b) {
                    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
                        return false;
                    // an identical "prototype" property.
                    if (a.prototype !== b.prototype) return false;
                    //~~~I've managed to break Object.keys through screwy arguments passing.
                    //   Converting to array solves the problem.
                    if (isArguments(a)) {
                        if (!isArguments(b)) {
                            return false;
                        }
                        a = pSlice.call(a);
                        b = pSlice.call(b);
                        return _deepEqual(a, b);
                    }
                    try{
                        var ka = _keys(a),
                            kb = _keys(b),
                            key, i;
                    } catch (e) {//happens when one is a string literal and the other isn't
                        return false;
                    }
                    // having the same number of owned properties (keys incorporates hasOwnProperty)
                    if (ka.length != kb.length)
                        return false;
                    //the same set of keys (although not necessarily the same order),
                    ka.sort();
                    kb.sort();
                    //~~~cheap key test
                    for (i = ka.length - 1; i >= 0; i--) {
                        if (ka[i] != kb[i])
                            return false;
                    }
                    //equivalent values for every corresponding key, and
                    //~~~possibly expensive deep test
                    for (i = ka.length - 1; i >= 0; i--) {
                        key = ka[i];
                        if (!_deepEqual(a[key], b[key] ))
                            return false;
                    }
                    return true;
                }

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

                assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
                    if (_deepEqual(actual, expected)) {
                        fail(actual, expected, message, "notDeepEqual", assert.notDeepEqual);
                    }
                };

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

                assert.strictEqual = function strictEqual(actual, expected, message) {
                    if (actual !== expected) {
                        fail(actual, expected, message, "===", assert.strictEqual);
                    }
                };

// 10. The strict non-equality assertion tests for strict inequality, as determined by !==.
// assert.notStrictEqual(actual, expected, message_opt);

                assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
                    if (actual === expected) {
                        fail(actual, expected, message, "!==", assert.notStrictEqual);
                    }
                };

                function expectedException(actual, expected) {
                    if (!actual || !expected) {
                        return false;
                    }

                    if (expected instanceof RegExp) {
                        return expected.test(actual.message || actual);
                    } else if (actual instanceof expected) {
                        return true;
                    } else if (expected.call({}, actual) === true) {
                        return true;
                    }

                    return false;
                }

                function _throws(shouldThrow, block, expected, message) {
                    var actual;

                    if (typeof expected === 'string') {
                        message = expected;
                        expected = null;
                    }

                    try {
                        block();
                    } catch (e) {
                        actual = e;
                    }

                    message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
                        (message ? ' ' + message : '.');

                    if (shouldThrow && !actual) {
                        fail('Missing expected exception' + message);
                    }

                    if (!shouldThrow && expectedException(actual, expected)) {
                        fail('Got unwanted exception' + message);
                    }

                    if ((shouldThrow && actual && expected &&
                            !expectedException(actual, expected)) || (!shouldThrow && actual)) {
                        throw actual;
                    }
                }

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

                assert.throws = function(block, /*optional*/error, /*optional*/message) {
                    _throws.apply(this, [true].concat(pSlice.call(arguments)));
                };

// EXTENSION! This is annoying to write outside this module.
                assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
                    _throws.apply(this, [false].concat(pSlice.call(arguments)));
                };

                assert.ifError = function (err) { if (err) {throw err;}};
            })(assert);
            (function(exports){
                /*!
                 * Nodeunit
                 * Copyright (c) 2010 Caolan McMahon
                 * MIT Licensed
                 *
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 * Only code on that line will be removed, it's mostly to avoid requiring code
                 * that is node specific
                 */

                /**
                 * Module dependencies
                 */



                /**
                 * Creates assertion objects representing the result of an assert call.
                 * Accepts an object or AssertionError as its argument.
                 *
                 * @param {object} obj
                 * @api public
                 */

                exports.assertion = function (obj) {
                    return {
                        method: obj.method || '',
                        message: obj.message || (obj.error && obj.error.message) || '',
                        error: obj.error,
                        passed: function () {
                            return !this.error;
                        },
                        failed: function () {
                            return Boolean(this.error);
                        }
                    };
                };

                /**
                 * Creates an assertion list object representing a group of assertions.
                 * Accepts an array of assertion objects.
                 *
                 * @param {Array} arr
                 * @param {Number} duration
                 * @api public
                 */

                exports.assertionList = function (arr, duration) {
                    var that = arr || [];
                    that.failures = function () {
                        var failures = 0;
                        for (var i = 0; i < this.length; i += 1) {
                            if (this[i].failed()) {
                                failures += 1;
                            }
                        }
                        return failures;
                    };
                    that.passes = function () {
                        return that.length - that.failures();
                    };
                    that.duration = duration || 0;
                    return that;
                };

                /**
                 * Create a wrapper function for assert module methods. Executes a callback
                 * after it's complete with an assertion object representing the result.
                 *
                 * @param {Function} callback
                 * @api private
                 */

                var assertWrapper = function (callback) {
                    return function (new_method, assert_method, arity) {
                        return function () {
                            var message = arguments[arity - 1];
                            var a = exports.assertion({method: new_method, message: message});
                            try {
                                assert[assert_method].apply(null, arguments);
                            }
                            catch (e) {
                                a.error = e;
                            }
                            callback(a);
                        };
                    };
                };

                /**
                 * Creates the 'test' object that gets passed to every test function.
                 * Accepts the name of the test function as its first argument, followed by
                 * the start time in ms, the options object and a callback function.
                 *
                 * @param {String} name
                 * @param {Number} start
                 * @param {Object} options
                 * @param {Function} callback
                 * @api public
                 */

                exports.test = function (name, start, options, callback) {
                    var expecting;
                    var a_list = [];

                    var wrapAssert = assertWrapper(function (a) {
                        a_list.push(a);
                        if (options.log) {
                            async.nextTick(function () {
                                options.log(a);
                            });
                        }
                    });

                    var test = {
                        done: function (err) {
                            if (expecting !== undefined && expecting !== a_list.length) {
                                var e = new Error(
                                    'Expected ' + expecting + ' assertions, ' +
                                    a_list.length + ' ran'
                                );
                                var a1 = exports.assertion({method: 'expect', error: e});
                                a_list.push(a1);
                                if (options.log) {
                                    async.nextTick(function () {
                                        options.log(a1);
                                    });
                                }
                            }
                            if (err) {
                                var a2 = exports.assertion({error: err});
                                a_list.push(a2);
                                if (options.log) {
                                    async.nextTick(function () {
                                        options.log(a2);
                                    });
                                }
                            }
                            var end = new Date().getTime();
                            async.nextTick(function () {
                                var assertion_list = exports.assertionList(a_list, end - start);
                                options.testDone(name, assertion_list);
                                callback(null, a_list);
                            });
                        },
                        ok: wrapAssert('ok', 'ok', 2),
                        same: wrapAssert('same', 'deepEqual', 3),
                        equals: wrapAssert('equals', 'equal', 3),
                        expect: function (num) {
                            expecting = num;
                        },
                        _assertion_list: a_list
                    };
                    // add all functions from the assert module
                    for (var k in assert) {
                        if (assert.hasOwnProperty(k)) {
                            test[k] = wrapAssert(k, k, assert[k].length);
                        }
                    }
                    return test;
                };

                /**
                 * Ensures an options object has all callbacks, adding empty callback functions
                 * if any are missing.
                 *
                 * @param {Object} opt
                 * @return {Object}
                 * @api public
                 */

                exports.options = function (opt) {
                    var optionalCallback = function (name) {
                        opt[name] = opt[name] || function () {};
                    };

                    optionalCallback('moduleStart');
                    optionalCallback('moduleDone');
                    optionalCallback('testStart');
                    optionalCallback('testDone');
                    //optionalCallback('log');

                    // 'done' callback is not optional.

                    return opt;
                };
            })(types);
            (function(exports){
                /*!
                 * Nodeunit
                 * Copyright (c) 2010 Caolan McMahon
                 * MIT Licensed
                 *
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 * Only code on that line will be removed, it's mostly to avoid requiring code
                 * that is node specific
                 */

                /**
                 * Module dependencies
                 */



                /**
                 * Added for browser compatibility
                 */

                var _keys = function (obj) {
                    if (Object.keys) {
                        return Object.keys(obj);
                    }
                    var keys = [];
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k)) {
                            keys.push(k);
                        }
                    }
                    return keys;
                };


                var _copy = function (obj) {
                    var nobj = {};
                    var keys = _keys(obj);
                    for (var i = 0; i <  keys.length; i += 1) {
                        nobj[keys[i]] = obj[keys[i]];
                    }
                    return nobj;
                };


                /**
                 * Runs a test function (fn) from a loaded module. After the test function
                 * calls test.done(), the callback is executed with an assertionList as its
                 * second argument.
                 *
                 * @param {String} name
                 * @param {Function} fn
                 * @param {Object} opt
                 * @param {Function} callback
                 * @api public
                 */

                exports.runTest = function (name, fn, opt, callback) {
                    var options = types.options(opt);

                    options.testStart(name);
                    var start = new Date().getTime();
                    var test = types.test(name, start, options, callback);

                    try {
                        fn(test);
                    }
                    catch (e) {
                        test.done(e);
                    }
                };

                /**
                 * Takes an object containing test functions or other test suites as properties
                 * and runs each in series. After all tests have completed, the callback is
                 * called with a list of all assertions as the second argument.
                 *
                 * If a name is passed to this function it is prepended to all test and suite
                 * names that run within it.
                 *
                 * @param {String} name
                 * @param {Object} suite
                 * @param {Object} opt
                 * @param {Function} callback
                 * @api public
                 */

                exports.runSuite = function (name, suite, opt, callback) {
                    suite = wrapGroup(suite);
                    var keys = _keys(suite);

                    async.concatSeries(keys, function (k, cb) {
                        var prop = suite[k], _name;

                        _name = name ? [].concat(name, k) : [k];
                        _name.toString = function () {
                            // fallback for old one
                            return this.join(' - ');
                        };

                        if (typeof prop === 'function') {
                            var in_name = false,
                                in_specific_test = (_name.toString() === opt.testFullSpec) ? true : false;
                            for (var i = 0; i < _name.length; i += 1) {
                                if (_name[i] === opt.testspec) {
                                    in_name = true;
                                }
                            }

                            if ((!opt.testFullSpec || in_specific_test) && (!opt.testspec || in_name)) {
                                if (opt.moduleStart) {
                                    opt.moduleStart();
                                }
                                exports.runTest(_name, suite[k], opt, cb);
                            }
                            else {
                                return cb();
                            }
                        }
                        else {
                            exports.runSuite(_name, suite[k], opt, cb);
                        }
                    }, callback);
                };

                /**
                 * Run each exported test function or test suite from a loaded module.
                 *
                 * @param {String} name
                 * @param {Object} mod
                 * @param {Object} opt
                 * @param {Function} callback
                 * @api public
                 */

                exports.runModule = function (name, mod, opt, callback) {
                    var options = _copy(types.options(opt));

                    var _run = false;
                    var _moduleStart = options.moduleStart;

                    mod = wrapGroup(mod);

                    function run_once() {
                        if (!_run) {
                            _run = true;
                            _moduleStart(name);
                        }
                    }
                    options.moduleStart = run_once;

                    var start = new Date().getTime();

                    exports.runSuite(null, mod, options, function (err, a_list) {
                        var end = new Date().getTime();
                        var assertion_list = types.assertionList(a_list, end - start);
                        options.moduleDone(name, assertion_list);
                        if (nodeunit.complete) {
                            nodeunit.complete(name, assertion_list);
                        }
                        callback(null, a_list);
                    });
                };

                /**
                 * Treats an object literal as a list of modules keyed by name. Runs each
                 * module and finished with calling 'done'. You can think of this as a browser
                 * safe alternative to runFiles in the nodeunit module.
                 *
                 * @param {Object} modules
                 * @param {Object} opt
                 * @api public
                 */

// TODO: add proper unit tests for this function
                exports.runModules = function (modules, opt) {
                    var all_assertions = [];
                    var options = types.options(opt);
                    var start = new Date().getTime();

                    async.concatSeries(_keys(modules), function (k, cb) {
                            exports.runModule(k, modules[k], options, cb);
                        },
                        function (err, all_assertions) {
                            var end = new Date().getTime();
                            options.done(types.assertionList(all_assertions, end - start));
                        });
                };


                /**
                 * Wraps a test function with setUp and tearDown functions.
                 * Used by testCase.
                 *
                 * @param {Function} setUp
                 * @param {Function} tearDown
                 * @param {Function} fn
                 * @api private
                 */

                var wrapTest = function (setUp, tearDown, fn) {
                    return function (test) {
                        var context = {};
                        if (tearDown) {
                            var done = test.done;
                            test.done = function (err) {
                                try {
                                    tearDown.call(context, function (err2) {
                                        if (err && err2) {
                                            test._assertion_list.push(
                                                types.assertion({error: err})
                                            );
                                            return done(err2);
                                        }
                                        done(err || err2);
                                    });
                                }
                                catch (e) {
                                    done(e);
                                }
                            };
                        }
                        if (setUp) {
                            setUp.call(context, function (err) {
                                if (err) {
                                    return test.done(err);
                                }
                                fn.call(context, test);
                            });
                        }
                        else {
                            fn.call(context, test);
                        }
                    };
                };


                /**
                 * Returns a serial callback from two functions.
                 *
                 * @param {Function} funcFirst
                 * @param {Function} funcSecond
                 * @api private
                 */

                var getSerialCallback = function (fns) {
                    if (!fns.length) {
                        return null;
                    }
                    return function (callback) {
                        var that = this;
                        var bound_fns = [];
                        for (var i = 0, len = fns.length; i < len; i++) {
                            (function (j) {
                                bound_fns.push(function () {
                                    return fns[j].apply(that, arguments);
                                });
                            })(i);
                        }
                        return async.series(bound_fns, callback);
                    };
                };


                /**
                 * Wraps a group of tests with setUp and tearDown functions.
                 * Used by testCase.
                 *
                 * @param {Object} group
                 * @param {Array} setUps - parent setUp functions
                 * @param {Array} tearDowns - parent tearDown functions
                 * @api private
                 */

                var wrapGroup = function (group, setUps, tearDowns) {
                    var tests = {};

                    var setUps = setUps ? setUps.slice(): [];
                    var tearDowns = tearDowns ? tearDowns.slice(): [];

                    if (group.setUp) {
                        setUps.push(group.setUp);
                        delete group.setUp;
                    }
                    if (group.tearDown) {
                        tearDowns.unshift(group.tearDown);
                        delete group.tearDown;
                    }

                    var keys = _keys(group);

                    for (var i = 0; i < keys.length; i += 1) {
                        var k = keys[i];
                        if (typeof group[k] === 'function') {
                            tests[k] = wrapTest(
                                getSerialCallback(setUps),
                                getSerialCallback(tearDowns),
                                group[k]
                            );
                        }
                        else if (typeof group[k] === 'object') {
                            tests[k] = wrapGroup(group[k], setUps, tearDowns);
                        }
                    }
                    return tests;
                };


                /**
                 * Backwards compatibility for test suites using old testCase API
                 */

                exports.testCase = function (suite) {
                    return suite;
                };
            })(core);
            (function(exports){
                /*!
                 * Nodeunit
                 * Copyright (c) 2010 Caolan McMahon
                 * MIT Licensed
                 *
                 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
                 * Only code on that line will be removed, its mostly to avoid requiring code
                 * that is node specific
                 */


                /**
                 * NOTE: this test runner is not listed in index.js because it cannot be
                 * used with the command-line tool, only inside the browser.
                 */


                /**
                 * Reporter info string
                 */

                exports.info = "Browser-based test reporter";


                /**
                 * Run all tests within each module, reporting the results
                 *
                 * @param {Array} files
                 * @api public
                 */

                exports.run = function (modules, options) {
                    var start = new Date().getTime(), div;
                    options = options || {};
                    div = options.div || document.body;

                    function setText(el, txt) {
                        if ('innerText' in el) {
                            el.innerText = txt;
                        }
                        else if ('textContent' in el){
                            el.textContent = txt;
                        }
                    }

                    function getOrCreate(tag, id) {
                        var el = document.getElementById(id);
                        if (!el) {
                            el = document.createElement(tag);
                            el.id = id;
                            div.appendChild(el);
                        }
                        return el;
                    };

                    var header = getOrCreate('h1', 'nodeunit-header');
                    var banner = getOrCreate('h2', 'nodeunit-banner');
                    var userAgent = getOrCreate('h2', 'nodeunit-userAgent');
                    var tests = getOrCreate('ol', 'nodeunit-tests');
                    var result = getOrCreate('p', 'nodeunit-testresult');

                    setText(userAgent, navigator.userAgent);

                    nodeunit.runModules(modules, {
                        moduleStart: function (name) {
                            /*var mheading = document.createElement('h2');
                            mheading.innerText = name;
                            results.appendChild(mheading);
                            module = document.createElement('ol');
                            results.appendChild(module);*/
                        },
                        testDone: function (name, assertions) {
                            var test = document.createElement('li');
                            var strong = document.createElement('strong');
                            strong.innerHTML = name + ' <b style="color: black;">(' +
                                '<b class="fail">' + assertions.failures() + '</b>, ' +
                                '<b class="pass">' + assertions.passes() + '</b>, ' +
                                assertions.length +
                                ')</b>';
                            test.className = assertions.failures() ? 'fail': 'pass';
                            test.appendChild(strong);

                            var aList = document.createElement('ol');
                            aList.style.display = 'none';
                            test.onclick = function () {
                                var d = aList.style.display;
                                aList.style.display = (d == 'none') ? 'block': 'none';
                            };
                            for (var i=0; i<assertions.length; i++) {
                                var li = document.createElement('li');
                                var a = assertions[i];
                                if (a.failed()) {
                                    li.innerHTML = (a.message || a.method || 'no message') +
                                        '<pre>' + (a.error.stack || a.error) + '</pre>';
                                    li.className = 'fail';
                                }
                                else {
                                    li.innerHTML = a.message || a.method || 'no message';
                                    li.className = 'pass';
                                }
                                aList.appendChild(li);
                            }
                            test.appendChild(aList);
                            tests.appendChild(test);
                        },
                        done: function (assertions) {
                            var end = new Date().getTime();
                            var duration = end - start;

                            var failures = assertions.failures();
                            banner.className = failures ? 'fail': 'pass';

                            result.innerHTML = 'Tests completed in ' + duration +
                                ' milliseconds.<br/><span class="passed">' +
                                assertions.passes() + '</span> assertions of ' +
                                '<span class="all">' + assertions.length + '<span> passed, ' +
                                assertions.failures() + ' failed.';
                        }
                    });
                };
            })(reporter);
            nodeunit = core;
            nodeunit.assert = assert;
            nodeunit.reporter = reporter;
            nodeunit.run = reporter.run;
            return nodeunit; })();




        return Influence;
    })(Influence);
}


var checkCampaignActive = function(config, cb) {
    var url = 'http://localhost:1337/campaign/track/' + config;
    httpGetAsync(url, function(res) {
        response = JSON.parse(res);
        if(response)
            cb(null, response);
        else
            cb(true);
    });
}

var InfluenceTracker = function(config) {
    if (!(this instanceof InfluenceTracker)) return new InfluenceTracker(config);

    this.config = config;
};


/*

	countUp.js
	by @inorganik

*/

// target = id of html element or var of previously selected html element where counting occurs
// startVal = the value you want to begin at
// endVal = the value you want to arrive at
// decimals = number of decimal places, default 0
// duration = duration of animation in seconds, default 2
// options = optional object of options (see below)

function CountUp(target, startVal, endVal, decimals, duration, options) {

    var self = this;
    self.version = function () { return '1.9.3'; };

    // default options
    self.options = {
        useEasing: true, // toggle easing
        useGrouping: true, // 1,000,000 vs 1000000
        separator: ',', // character to use as a separator
        decimal: '.', // character to use as a decimal
        easingFn: easeOutExpo, // optional custom easing function, default is Robert Penner's easeOutExpo
        formattingFn: formatNumber, // optional custom formatting function, default is formatNumber above
        prefix: '', // optional text before the result
        suffix: '', // optional text after the result
        numerals: [] // optionally pass an array of custom numerals for 0-9
    };

    // extend default options with passed options object
    if (options && typeof options === 'object') {
        for (var key in self.options) {
            if (options.hasOwnProperty(key) && options[key] !== null) {
                self.options[key] = options[key];
            }
        }
    }

    if (self.options.separator === '') {
        self.options.useGrouping = false;
    }
    else {
        // ensure the separator is a string (formatNumber assumes this)
        self.options.separator = '' + self.options.separator;
    }

    // make sure requestAnimationFrame and cancelAnimationFrame are defined
    // polyfill for browsers without native support
    // by Opera engineer Erik MÃƒÆ’Ã‚Â¶ller
    var lastTime = 0;
    var vendors = ['webkit', 'moz', 'ms', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

    function formatNumber(num) {
        var neg = (num < 0),
            x, x1, x2, x3, i, len;
        num = Math.abs(num).toFixed(self.decimals);
        num += '';
        x = num.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? self.options.decimal + x[1] : '';
        if (self.options.useGrouping) {
            x3 = '';
            for (i = 0, len = x1.length; i < len; ++i) {
                if (i !== 0 && ((i % 3) === 0)) {
                    x3 = self.options.separator + x3;
                }
                x3 = x1[len - i - 1] + x3;
            }
            x1 = x3;
        }
        // optional numeral substitution
        if (self.options.numerals.length) {
            x1 = x1.replace(/[0-9]/g, function(w) {
                return self.options.numerals[+w];
            })
            x2 = x2.replace(/[0-9]/g, function(w) {
                return self.options.numerals[+w];
            })
        }
        return (neg ? '-' : '') + self.options.prefix + x1 + x2 + self.options.suffix;
    }
    // Robert Penner's easeOutExpo
    function easeOutExpo(t, b, c, d) {
        return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
    }
    function ensureNumber(n) {
        return (typeof n === 'number' && !isNaN(n));
    }

    self.initialize = function() {
        if (self.initialized) return true;

        self.error = '';
        self.d = (typeof target === 'string') ? document.getElementById(target) : target;
        if (!self.d) {
            self.error = '[CountUp] target is null or undefined'
            return false;
        }
        self.startVal = Number(startVal);
        self.endVal = Number(endVal);
        // error checks
        if (ensureNumber(self.startVal) && ensureNumber(self.endVal)) {
            self.decimals = Math.max(0, decimals || 0);
            self.dec = Math.pow(10, self.decimals);
            self.duration = Number(duration) * 1000 || 2000;
            self.countDown = (self.startVal > self.endVal);
            self.frameVal = self.startVal;
            self.initialized = true;
            return true;
        }
        else {
            self.error = '[CountUp] startVal ('+startVal+') or endVal ('+endVal+') is not a number';
            return false;
        }
    };

    // Print value to target
    self.printValue = function(value) {
        var result = self.options.formattingFn(value);

        if (self.d.tagName === 'INPUT') {
            this.d.value = result;
        }
        else if (self.d.tagName === 'text' || self.d.tagName === 'tspan') {
            this.d.textContent = result;
        }
        else {
            this.d.innerHTML = result;
        }
    };

    self.count = function(timestamp) {

        if (!self.startTime) { self.startTime = timestamp; }

        self.timestamp = timestamp;
        var progress = timestamp - self.startTime;
        self.remaining = self.duration - progress;

        // to ease or not to ease
        if (self.options.useEasing) {
            if (self.countDown) {
                self.frameVal = self.startVal - self.options.easingFn(progress, 0, self.startVal - self.endVal, self.duration);
            } else {
                self.frameVal = self.options.easingFn(progress, self.startVal, self.endVal - self.startVal, self.duration);
            }
        } else {
            if (self.countDown) {
                self.frameVal = self.startVal - ((self.startVal - self.endVal) * (progress / self.duration));
            } else {
                self.frameVal = self.startVal + (self.endVal - self.startVal) * (progress / self.duration);
            }
        }

        // don't go past endVal since progress can exceed duration in the last frame
        if (self.countDown) {
            self.frameVal = (self.frameVal < self.endVal) ? self.endVal : self.frameVal;
        } else {
            self.frameVal = (self.frameVal > self.endVal) ? self.endVal : self.frameVal;
        }

        // decimal
        self.frameVal = Math.round(self.frameVal*self.dec)/self.dec;

        // format and print value
        self.printValue(self.frameVal);

        // whether to continue
        if (progress < self.duration) {
            self.rAF = requestAnimationFrame(self.count);
        } else {
            if (self.callback) self.callback();
        }
    };
    // start your animation
    self.start = function(callback) {
        if (!self.initialize()) return;
        self.callback = callback;
        self.rAF = requestAnimationFrame(self.count);
    };
    // toggles pause/resume animation
    self.pauseResume = function() {
        if (!self.paused) {
            self.paused = true;
            cancelAnimationFrame(self.rAF);
        } else {
            self.paused = false;
            delete self.startTime;
            self.duration = self.remaining;
            self.startVal = self.frameVal;
            requestAnimationFrame(self.count);
        }
    };
    // reset to startVal so animation can be run again
    self.reset = function() {
        self.paused = false;
        delete self.startTime;
        self.initialized = false;
        if (self.initialize()) {
            cancelAnimationFrame(self.rAF);
            self.printValue(self.startVal);
        }
    };
    // pass a new endVal and start animation
    self.update = function (newEndVal) {
        if (!self.initialize()) return;
        newEndVal = Number(newEndVal);
        if (!ensureNumber(newEndVal)) {
            self.error = '[CountUp] update() - new endVal is not a number: '+newEndVal;
            return;
        }
        self.error = '';
        if (newEndVal === self.frameVal) return;
        cancelAnimationFrame(self.rAF);
        self.paused = false;
        delete self.startTime;
        self.startVal = self.frameVal;
        self.endVal = newEndVal;
        self.countDown = (self.startVal > self.endVal);
        self.rAF = requestAnimationFrame(self.count);
    };

    // format startVal on initialization
    if (self.initialize()) self.printValue(self.startVal);
};


var Notifications = function(config) {
    if (!(this instanceof Notifications)) return new Notifications(config);
    this.config = config;
    var rule, notificationPath;
    var rulesUrl = 'http://localhost:1337/rules/configuration/path/' + config;
    httpGetAsync(rulesUrl, function(res) {
        response = JSON.parse(res);
        rule = response.rule;
        notificationPath = response.notificationPath;
        var splittedUrls = ["live", "identification", "journey"];
        notificationPath = notificationPath.filter(notifPath => notifPath.type == 'display');
        notificationPath = notificationPath.map(notifPath => notifPath.url);
        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if(rule && (rule.displayOnAllPages || notificationPath.indexOf(window.location.pathname) != -1) && !(isMobile && rule.hideNotification)) {
            loopThroughSplittedNotifications(splittedUrls, rule, notificationPath, config);
        }
    });
};

async function loopThroughSplittedNotifications(splittedUrls, rule, notificationPath, config) {
    var link = document.createElement("link");
    link.href = "https://storage.googleapis.com/influence-197607.appspot.com/note.css";
    link.type = "text/css";
    link.rel = "stylesheet";
    link.id = "stylesheetID";
    document.getElementsByTagName("head")[0].appendChild(link);

    var animationLink = document.createElement("link");
    animationLink.href = 'https://storage.googleapis.com/influence-197607.appspot.com/animate.css';
    animationLink.type = "text/css";
    animationLink.rel = "stylesheet";
    animationLink.id = "stylesheetID";
    document.getElementsByTagName("head")[0].appendChild(animationLink);

    //
    // var MomentCDN = document.createElement('script');
    // MomentCDN.setAttribute('src','https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.1/moment.min.js');
    // document.body.appendChild(MomentCDN);

    // var TimeHacker = document.createElement('script');
    // TimeHacker.setAttribute('src','https://storage.googleapis.com/influence-197607.appspot.com/time-hacker.js');
    // document.head.appendChild(TimeHacker);

    let j = 1;
    var responseNotifications = [];
    var loopCheckValue = rule.loopNotification?1000:3;
    console.log(loopCheckValue, '==================>loopCheckValue');
    let responseNotif = (callback) => {
        splittedUrls.map(async notifName => {
            var url = 'http://localhost:1337/elasticsearch/search/' + config + '?type=' + notifName;
            await httpGetAsync(url, function(res) {
                response = JSON.parse(res);
                let index = notifName == 'live'? 0 : notifName == 'identification' ? 1 : 2;
                responseNotifications.splice( index, 0, {[notifName]: response} )
                callback(null, responseNotifications, config)
            });
        });
    }

    responseNotif((err, result, config) => {
        let m = 1;
        let userLength = 1;
        let loopCheckExit = [];
        if(result.length == 3) {

            for (let i = 0; i < splittedUrls.length; i++) {
                if(j >  loopCheckValue) {
                    i = 4;
                    setTimeout(() => new Notifications(config), ((rule.loopNotification?11988:24)+12)*1000);//11988
                    return;
                }
                (function (u, v) {
                    var notif = responseNotifications[u];
                    var key = Object.keys(notif);
                    response = notif[key];
                    if (response.message && !response.message.error) {
                        const info = response.message;
                        let configurations = response.message.configurations.filter(config => config.paths.indexOf(window.location.pathname) > -1);
                        configurations = info.rule.displayOnAllPages && !configurations.length?info.configurations:configurations;
                        let paths = configurations.length?configurations[0].paths:[];
                        let configuration, randomDelayTime, tempRandomDelayTime = 0 ;

                        if(configurations.length)
                            configuration = configurations[0].configuration;
                        else
                            configuration = undefined;

                        let liveVisitorCount = info.response && info.response.aggregations && info.response.aggregations.users && key == 'live' ? info.response.aggregations.users.buckets.filter(visitor => paths.indexOf(visitor.key.path) > -1).length : null;
                        if(info.rule.displayOnAllPages)
                            liveVisitorCount = info.response && info.response.aggregations && info.response.aggregations.users && key == 'live'?info.response.aggregations.users.buckets.length:0;

                        let userDetails = info.userDetails && info.userDetails.length && (key == 'journey' || key == 'identification') ? info.userDetails.filter(user => user) : [];

                        if((key == 'journey' && !userDetails.length) ||
                            (key == 'identification' && !userDetails.length ||
                                (key == 'live' && info.response && info.response.aggregations && configuration && Number(configuration.panelStyle.liveVisitorCount) >= liveVisitorCount)
                            )) {
                            j = j-1;
                            if(loopCheckExit.indexOf(key[0]) == -1)
                                loopCheckExit.push(key[0]);
                            if(loopCheckExit.length == 3)
                                i = 4;
                            return;
                        }

                        if(rule.delayNotification) {
                            randomDelayTime = (Math.floor(Math.random() * 10) + 3);
                        }

                        if(configuration && configuration.activity) {
                            if(j == 1)
                                setTimeout(function(){
                                    return notificationTimeout(u, info, rule, key, notificationPath);
                                }, (rule.initialDelay)*1000);
                            else
                                setTimeout(function(){
                                    return notificationTimeout(u, info, rule, key, notificationPath);
                                }, (rule.delayNotification?(randomDelayTime + tempRandomDelayTime):((rule.displayTime+rule.delayBetween+3)*(v-1))*1000));
                            tempRandomDelayTime = randomDelayTime;
                        }
                    } else {
                        console.log('Send data to us using websocket ')
                    }
                })(i, j);

                j++;

                if(responseNotifications[i] && Object.keys(responseNotifications[i]) == 'journey') {
                    if(responseNotifications[i] && responseNotifications[i].journey.message && responseNotifications[i].journey.message.userDetails && responseNotifications[i].journey.message.userDetails.length < 8 && userLength < responseNotifications[i].journey.message.userDetails.length) {
                        i = 1;
                        ++userLength;
                    } else if(responseNotifications[i] && responseNotifications[i].journey.message && responseNotifications[i].journey.message.userDetails && responseNotifications[i].journey.message.userDetails.length < 8 && userLength >= responseNotifications[i].journey.message.userDetails.length) {
                        i = 2;
                        userLength = 1;
                    } else if(m%8 == 0) {
                        i = 2
                        m++;
                    } else {
                        m++;
                        i = 1;
                    }
                }

                if(i == splittedUrls.length-1) {
                    i = -1;
                }
            }
        }
    });
}

function notificationTimeout(i, info, rule, key, notificationPath) {
    if(notificationPath.indexOf(window.location.pathname) === -1 && !rule.displayOnAllPages)
        return;
    var note = new Note({});

    let configurations = info.configurations.filter(config => config.paths.indexOf(window.location.pathname) > -1);
    configurations = rule.displayOnAllPages && !configurations.length?info.configurations:configurations;

    let configuration;
    if(configurations.length)
        configuration = configurations[0].configuration;
    else
        configuration = undefined;

    const displayPosition = info.rule.displayPosition;
    let containerStyle, iconStyle, alignment, left, bottom, top, fadein, fadeout;
    switch(displayPosition) {
        case 'Bottom Right':
            alignment = "z-index: 99999999999; position: fixed; right: 10px; bottom: 10px;";
            break;
        case 'Bottom Left':
            alignment = "z-index: 99999999999; position: fixed; left: 10px; bottom: 10px;";
            break;
        case 'Bottom Center':
            alignment = "z-index: 99999999999; position: fixed; left: 50%; transform: translate(-50%, 0); bottom: 10px;";
            break;
        case 'Top Left':
            alignment = "z-index: 99999999999; position: fixed; left: 0px; top: 10px;";
            break;
        case 'Top Right':
            alignment = "z-index: 99999999999; position: fixed; right: 10px; top: 10px;";
            break;
        case 'Top Center':
            alignment = "z-index: 99999999999; position: fixed; left: 50%; transform: translate(-50%, 0); top: 10px;";
            break;
        default:
            alignment = "z-index: 99999999999; position: fixed; left: 10px; bottom: 10px;";
    }


    if(configuration) {
        const panelStyle = configuration.panelStyle;
        const backgroundColor = panelStyle.backgroundColor;
        const borderColor = panelStyle.borderColor;
        const color = panelStyle.color;

        containerStyle = `
        border-radius: ${panelStyle.radius}px;
        background-color: rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a});
        border-color: rgb(${borderColor.r}, ${borderColor.g}, ${borderColor.b}, ${borderColor.a});
        box-shadow: rgb(0, 0, 0) ${panelStyle.shadow}px ${panelStyle.shadow}px ${panelStyle.blur}px;
        color: rgb(${color.r}, ${color.g}, ${color.b});
        border-width: ${panelStyle.borderWidth}px;
        height: ${72+panelStyle.borderWidth*2}px;
        font-family: ${panelStyle.fontFamily};
        font-Weight: ${panelStyle.fontWeight};
      `;
        iconStyle = `border-radius: ${panelStyle.radius}px;`;
    } else {
        iconStyle = `border-radius: 50px;`;
    }
    note.notificationdisplay(key, info, containerStyle, iconStyle, alignment);
}

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}


InfluenceTracker.prototype.tracker = function(info) {
    console.log(info);
    var path = info.path;
    var value = info.value;

    if (typeof console !== 'undefined') {
        console.log(path);
        console.log(value);

        // Send data to the backend
        var data = {}


        data.path = path;
        data.value = value;



        //Send the proper header information along with the request

        if ("WebSocket" in window)
        {
            console.log("WebSocket is supported by your Browser!");

            // Let us open a web socket
            var ws = new WebSocket("ws://localhost:1337/web");

            ws.onopen = function()
            {
                // Web Socket is connected, send data using send()
                ws.send(JSON.stringify(data));
                console.log("Message is sent...",data);
            };

            ws.onmessage = function (evt)
            {
                var received_msg = evt.data;
                console.log("Message is received...");
            };

            ws.onclose = function()
            {
                // websocket is closed.
                console.log("Connection is closed...");
            };

            window.onbeforeunload = function(event) {
                socket.close();
            };
        }

        else
        {
            // The browser doesn't support WebSocket
            console.log("WebSocket NOT supported by your Browser!");
        }


        info.success && setTimeout(info.success, 0);
    } else {
        info.failure && setTimeout(info.failure, 0);
    }
};

var timeSince = function(date) {

    if (typeof date !== 'object') {
        date = new Date(date);
    }
    var seconds = Math.floor((new Date() - date) / 1000);
    var intervalType;
    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        intervalType = 'year';
    } else {
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            intervalType = 'month';
        } else {
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                intervalType = 'day';
            } else {
                interval = Math.floor(seconds / 3600);
                if (interval >= 1) {
                    intervalType = "hour";
                } else {
                    interval = Math.floor(seconds / 60);
                    if (interval >= 1) {
                        intervalType = "minute";
                    } else {
                        interval = seconds;
                        intervalType = "second";
                    }
                }
            }
        }
    }

    if (interval > 1 || interval === 0) {
        intervalType += 's';
    }

    return interval + ' ' + intervalType + ' ago';
};
var aDay = 24 * 60 * 60;


let k = 0, notificationCloser;
var Note = function Note(config, containerStyle, iconStyle) {
    var numAnim;

    function displayNotification(container, config) {
        container.className =  `animated ${config.rule.popupAnimationIn}` ;
        if (!numAnim.error) {
            numAnim.start();
        } else {
            console.error(numAnim.error);
        }

        setTimeout(function() {
            container.className =  `animated ${config.rule.popupAnimationOut}` ;
        }, ((config.rule.displayTime)*1000)+3000);

        setTimeout(function() {
            container.parentNode.removeChild(container)
        }, ((config.rule.displayTime)*1000+4000));

        document.body.appendChild(container);
    };

    function notificationDisplay(type, config, containerStyle, iconStyle, alignment) {
        if(notificationCloser)
            return;
        let configurations = config.configurations.filter(config => config.paths.indexOf(window.location.pathname) > -1);
        configurations = config.rule.displayOnAllPages && !configurations.length?config.configurations:configurations;

        let configuration;
        let paths = configurations.length?configurations[0].paths:[];
        if(configurations.length)
            configuration = configurations.length?configurations[0].configuration:{};
        else
            configuration = {};
        let liveVisitorCount = config.response && config.response.aggregations && config.response.aggregations.users ? config.response.aggregations.users.buckets.filter(visitor => paths.indexOf(visitor.key.path) > -1).length : 0;
        if(config.rule.displayOnAllPages)
            liveVisitorCount = config.response && config.response.aggregations && config.response.aggregations.users?config.response.aggregations.users.buckets.length:0;

        let userDetails = config.userDetails && config.userDetails.length ? config.userDetails.filter(user => user) : [];

        var container = document.createElement('div');
        container.setAttribute("id", "FPqR2DbIqJeA2DbI7MM9_0");
        container.onclick = function(e) {
            if(e.target.tagName == 'IMG') {
                notificationCloser = true;
                return container.parentNode.removeChild(container);
            }


            if(configuration && configuration.notificationUrl)
                window.open(configuration.notificationUrl);
            else
                return;
        };

        container.style = alignment;
        var innerContainer = document.createElement('div');
        innerContainer.setAttribute("id", "FPqR3tRBqJeA3tRB7MM9_0");
        var innerDiv = document.createElement('div');
        var mainContainer = document.createElement('div');


        var notificationRecentContainer = document.createElement('div');
        notificationRecentContainer.style = type=='journey'?"display:block":"display:none";
        var innerNotifRecentContainer = document.createElement('div');
        innerNotifRecentContainer.setAttribute("id", "FPqR2fZIqJeA2fZI7MM9_0");
        var innerInnerNotifRecentContainer = document.createElement('div');
        innerInnerNotifRecentContainer.className = "FPqR3zjZqJeA3zjZ7MM9_0 FPqR2riIqJeA2riI7MM9_0";
        innerInnerNotifRecentContainer.style = containerStyle;

        var notifRecentImgContainer = document.createElement('div');
        notifRecentImgContainer.className = "FPqR1JYFqJeA1JYF7MM9_0";
        var notifRecentImg = document.createElement('img');
        var res_img = userDetails && userDetails[k]?
            configuration && configuration.toggleMap == 'map'?
                `https://image.maps.cit.api.here.com/mia/1.6/mapview?app_id=bflbOqqhUWvOqcJUKYhS&app_code=s5oTW_P89Zs1A_Le8hDw0g&lat=${userDetails[k].latitude}&lon=${userDetails[k].longitude}&z=10&h=200&w=200`
                :
                configuration.panelStyle.image
            // userDetails[k].profile_pic
            :
            null;
        notifRecentImg.setAttribute('src', res_img?res_img:"https://www.totaldenturecare.com.au/wp-content/uploads/2017/06/default-user-image-female.png");
        notifRecentImg.style = iconStyle;
        notifRecentImgContainer.appendChild(notifRecentImg);
        var notifRecentContentContainer = document.createElement('div');
        notifRecentContentContainer.className = "FPqR2EbCqJeA2EbC7MM9_0";
        var notificationRecentCloseContainer = document.createElement('div');
        notificationRecentCloseContainer.className = "FPqR2AUlqJeA2AUl7MM9_1";
        notificationRecentCloseContainer.style = config.rule.closeNotification?'display:flex':'display:none';
        var notificationRecentClose = document.createElement('img');
        notificationRecentClose.setAttribute('src', 'https://useinfluence.co/images/close-icon.png');
        notificationRecentCloseContainer.append(notificationRecentClose);
        var notifRecentContentI = document.createElement('div');
        notifRecentContentI.className = "FPqR2AUlqJeA2AUl7MM9_0";

        var res_name = userDetails && userDetails[k]?userDetails[k].username?userDetails[k].username:userDetails[k].response.json.value.form.firstname:null;
        res_name = res_name?res_name.replace(/[0-9]/g, '').toLowerCase().split('.').join(' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '):res_name;
        var user_details = userDetails && userDetails[k]?
            userDetails[k].city && userDetails[k].country && res_name ?
                `${res_name} from ${userDetails[k].city}, ${userDetails[k].country}`
                :
                userDetails[k].city && res_name?
                    `${res_name} from ${userDetails[k].city}`
                    :
                    userDetails[k].country && res_name?
                        `${res_name} from ${userDetails[k].country}`
                        :
                        res_name?
                            `${res_name}`
                            :
                            "Anonymous"
            : "Anonymous";

        notifRecentContentI.innerHTML = user_details;
        var notifRecentContentII = document.createElement('div');
        notifRecentContentII.className = "FPqR13BWqJeA13BW7MM9_0";
        notifRecentContentII.innerHTML = configuration.otherText +' '+ configuration.contentText;
        var notifRecentContentIII = document.createElement('div');
        notifRecentContentIII.className = "FPqR2PlWqJeA2PlW7MM9_0";
        var timeStamp = userDetails && userDetails[k]?userDetails[k].timestamp:new Date();
        notifRecentContentIII.innerHTML = timeStamp?timeSince(new Date(new Date(timeStamp)-aDay)):"Not available ";
        // notifRecentContentIII.innerHTML = timeStamp?customMoment(timeStamp).fromNow():"Not available ";
        var notifRecentContentIV = document.createElement('div');
        notifRecentContentIV.className = "FPqR3eNuqJeA3eNu7MM9_0";
        var notifRecentContentIVInnerI = document.createElement('i');
        var notifRecentContentSvg = document.createElement('img');
        notifRecentContentSvg.setAttribute('src', 'https://useinfluence.co/images/usericon.png');
        notifRecentContentIVInnerI.appendChild(notifRecentContentSvg);
        // var notifRecentContentIVSpan1 = document.createElement('span');
        // notifRecentContentIVSpan1.innerHTML = "by ";
        var notifRecentContentIVSpan2 = document.createElement('span');
        notifRecentContentIVSpan2.className = "FPqR12wMqJeA12wM7MM9_0";
        notifRecentContentIVSpan2.innerHTML = "Influence";
        // notifRecentContentIV.appendChild(notifRecentContentIVSpan1);
        notifRecentContentIV.appendChild(notifRecentContentIVInnerI);
        notifRecentContentIV.appendChild(notifRecentContentIVSpan2);
        notifRecentContentContainer.appendChild(notificationRecentCloseContainer);
        notifRecentContentContainer.appendChild(notifRecentContentI);
        notifRecentContentContainer.appendChild(notifRecentContentII);
        notifRecentContentContainer.appendChild(notifRecentContentIII);
        notifRecentContentContainer.appendChild(notifRecentContentIV);
        innerInnerNotifRecentContainer.appendChild(notifRecentImgContainer);
        innerInnerNotifRecentContainer.appendChild(notifRecentContentContainer);
        innerNotifRecentContainer.appendChild(innerInnerNotifRecentContainer);
        notificationRecentContainer.appendChild(innerNotifRecentContainer);

        var notificationLiveContainer = document.createElement('div');
        notificationLiveContainer.style = type=='live'?"display:block":"display:none";
        var innerNotifLiveContainer = document.createElement('div');
        innerNotifLiveContainer.setAttribute("id", "FPqR3dGiqJeA3dGi7MM9_0");
        var innerInnerNotifLiveContainer = document.createElement('div');
        innerInnerNotifLiveContainer.className = "FPqR2B_4qJeA2B_47MM9_0 rounded FPqRD2zVqJeAD2zV7MM9_0";
        innerInnerNotifLiveContainer.style = containerStyle;
        var innerMainNotifLiveContainer = document.createElement('div');
        innerMainNotifLiveContainer.setAttribute('id', "FPqR3acHqJeA3acH7MM9_0");

        var notifLiveImgContainer = document.createElement('div');
        notifLiveImgContainer.className = "FPqRH0WDqJeAH0WD7MM9_0";
        var notifLiveImg = document.createElement('div');
        notifLiveImg.className =  "FPqRh0ePqJeAh0eP7MM9_0";
        notifLiveImgContainer.appendChild(notifLiveImg);
        var notificationLiveCloseContainer = document.createElement('div');
        notificationLiveCloseContainer.className = "FPqR3acHqJeA3acH7MM9_1";
        notificationLiveCloseContainer.style = config.rule.closeNotification?'display:flex':'display:none';
        var notificationLiveClose = document.createElement('img');
        notificationLiveClose.setAttribute('src', 'https://useinfluence.co/images/close-icon.png');
        notificationLiveCloseContainer.append(notificationLiveClose);
        var notifLiveContentContainerI = document.createElement('div');
        notifLiveContentContainerI.className = "FPqR15RvqJeA15Rv7MM9_0";
        var notifLiveContentInnerContainer = document.createElement('div');
        notifLiveContentInnerContainer.className = "FPqR2fwXqJeA2fwX7MM9_0";
        var notifLiveContentSpan = document.createElement('span');
        notifLiveContentSpan.className = "FPqR1Jr6qJeA1Jr67MM9_0";
        var notifLiveContentInnerSpan = document.createElement('span');
        notifLiveContentInnerSpan.innerHTML = liveVisitorCount;
        var text_span = document.createTextNode(` ${configuration.visitorText}`);
        notifLiveContentSpan.appendChild(notifLiveContentInnerSpan);
        notifLiveContentSpan.appendChild(text_span);
        var text_span1 =  document.createElement('span');
        text_span1.className= "peopleviewActivity";
        var text_div = document.createTextNode(` ${configuration.liveVisitorText}`);
        text_span1.appendChild(text_div);
        notifLiveContentInnerContainer.appendChild(notifLiveContentSpan);
        notifLiveContentContainerI.appendChild(notifLiveContentInnerContainer);
        notifLiveContentContainerI.appendChild(text_span1);

        var notifLiveContentContainerII = document.createElement('div');
        notifLiveContentContainerII.className = "FPqR14UVqJeA14UV7MM9_0";
        var text_ContainerII = document.createTextNode('Verified by ');
        var notifLiveContentContainerII_I = document.createElement('i');
        var notifLiveContentImg = document.createElement('img');
        notifLiveContentImg.setAttribute('src', 'https://useinfluence.co/images/verifiedicon.png');
        notifLiveContentContainerII_I.appendChild(notifLiveContentImg);
        var notifLiveContentA = document.createElement('a');
        notifLiveContentA.setAttribute('href', 'https://useinfluence.co');
        notifLiveContentA.setAttribute('rel', 'nofollow');
        notifLiveContentA.setAttribute('target', '_blank');
        var createASpan = document.createElement('span');
        createASpan.className = "influencebrandMark";
        var createAText = document.createTextNode('Influence');
        createASpan.appendChild(createAText);
        notifLiveContentA.appendChild(createASpan);
        notifLiveContentContainerII.appendChild(text_ContainerII);
        notifLiveContentContainerII.appendChild(notifLiveContentContainerII_I);
        notifLiveContentContainerII.appendChild(notifLiveContentA);

        innerMainNotifLiveContainer.appendChild(notifLiveImgContainer);
        innerMainNotifLiveContainer.appendChild(notificationLiveCloseContainer);
        innerMainNotifLiveContainer.appendChild(notifLiveContentContainerI);
        innerMainNotifLiveContainer.appendChild(notifLiveContentContainerII);

        innerInnerNotifLiveContainer.appendChild(innerMainNotifLiveContainer);
        innerNotifLiveContainer.appendChild(innerInnerNotifLiveContainer);
        notificationLiveContainer.appendChild(innerNotifLiveContainer);

        var notificationBulkContainer = document.createElement('div');
        notificationBulkContainer.style = type=='identification'?"display:block":"display:none";
        var innerNotifBulkContainer = document.createElement('div');
        innerNotifBulkContainer.setAttribute("id", "FPqR2lriqJeA2lri7MM9_0");
        var innerInnerNotifBulkContainer = document.createElement('div');
        innerInnerNotifBulkContainer.className = "FPqR1XogqJeA1Xog7MM9_0 FPqR27wVqJeA27wV7MM9_0";
        innerInnerNotifBulkContainer.style = containerStyle;
        var notifBulkImgContainer = document.createElement('div');
        notifBulkImgContainer.className = "FPqR37xpqJeA37xp7MM9_0";
        var notifBulkImg = document.createElement('img');
        notifBulkImg.setAttribute('src', 'https://storage.googleapis.com/influence-197607.appspot.com/fire_icon_blue_6.png')
        notifBulkImgContainer.appendChild(notifBulkImg);

        var notifBulkContentContainer = document.createElement('div');
        notifBulkContentContainer.className = "FPqRqu5HqJeAqu5H7MM9_0";
        var notificationBulkCloseContainer = document.createElement('div');
        notificationBulkCloseContainer.className = "FPqRqu5HqJeAqu5H7MM9_1";
        notificationBulkCloseContainer.style = config.rule.closeNotification?'display:flex':'display:none';
        var notificationBulkClose = document.createElement('img');
        notificationBulkClose.setAttribute('src', 'https://useinfluence.co/images/close-icon.png');
        notificationBulkCloseContainer.append(notificationBulkClose);
        var notifBulkContentInnerContainer = document.createElement('div');
        var notifBulkContentSpan = document.createElement('span');
        notifBulkContentSpan.className = "FPqRtoc3qJeAtoc37MM9_0";
        var notifBulkContentInnerSpan = document.createElement('span');
        numAnim = new CountUp(notifBulkContentInnerSpan, 0, userDetails.length, 0, 3);
        // notifBulkContentInnerSpan.innerHTML = userDetails.length;
        var notifBulkContentInnerText = document.createTextNode(` ${configuration.visitorText}`);
        notifBulkContentSpan.appendChild(notifBulkContentInnerSpan);
        notifBulkContentSpan.appendChild(notifBulkContentInnerText);
        var notifBulkContentSpan1 = document.createElement('span');
        notifBulkContentSpan1.className = "signedupActivity";
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();
        if(dd<10) { dd='0'+dd }
        if(mm<10) { mm='0'+mm }
        today = yyyy+'/'+mm+'/'+dd;
        var date2 = new Date(today);
        var date1 = new Date(config.rule.createdAt);
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
        var notifBulkContentText = document.createTextNode(` ${configuration?configuration.otherText:''} ${configuration?configuration.contentText:''} in the last ${configuration.panelStyle.bulkData >= dayDifference?dayDifference:configuration.panelStyle.bulkData} ${configuration.panelStyle.selectDurationData}`);
        notifBulkContentSpan1.appendChild(notifBulkContentText);
        notifBulkContentInnerContainer.appendChild(notifBulkContentSpan);
        notifBulkContentInnerContainer.appendChild(notifBulkContentSpan1);
        notifBulkContentContainer.appendChild(notificationBulkCloseContainer);
        notifBulkContentContainer.appendChild(notifBulkContentInnerContainer);

        innerInnerNotifBulkContainer.appendChild(notifBulkImgContainer);
        innerInnerNotifBulkContainer.appendChild(notifBulkContentContainer);

        innerNotifBulkContainer.appendChild(innerInnerNotifBulkContainer);
        notificationBulkContainer.appendChild(innerNotifBulkContainer);

        mainContainer.appendChild(notificationRecentContainer);
        mainContainer.appendChild(notificationLiveContainer);
        mainContainer.appendChild(notificationBulkContainer);
        innerDiv.appendChild(mainContainer);
        innerContainer.appendChild(innerDiv);
        container.appendChild(innerContainer);

        if(type == 'journey' && userDetails && userDetails.length>k) {
            k++;
            k = k==userDetails.length?0:k;
        } else if(type == 'journey' && userDetails && userDetails.length<=k) {
            k = 0;
        }

        displayNotification(container, config);
    }

    return {
        notificationdisplay: function notificationdisplay(type, config, containerStyle, iconStyle, alignment) {
            notificationDisplay(type, config, containerStyle, iconStyle, alignment);
        }
    };
};


!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.customMoment=t()}(this,function(){"use strict";var e,i;function c(){return e.apply(null,arguments)}function o(e){return e instanceof Array||"[object Array]"===Object.prototype.toString.call(e)}function u(e){return null!=e&&"[object Object]"===Object.prototype.toString.call(e)}function l(e){return void 0===e}function d(e){return"number"==typeof e||"[object Number]"===Object.prototype.toString.call(e)}function h(e){return e instanceof Date||"[object Date]"===Object.prototype.toString.call(e)}function f(e,t){var n,s=[];for(n=0;n<e.length;++n)s.push(t(e[n],n));return s}function m(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function _(e,t){for(var n in t)m(t,n)&&(e[n]=t[n]);return m(t,"toString")&&(e.toString=t.toString),m(t,"valueOf")&&(e.valueOf=t.valueOf),e}function y(e,t,n,s){return Ot(e,t,n,s,!0).utc()}function g(e){return null==e._pf&&(e._pf={empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}),e._pf}function p(e){if(null==e._isValid){var t=g(e),n=i.call(t.parsedDateParts,function(e){return null!=e}),s=!isNaN(e._d.getTime())&&t.overflow<0&&!t.empty&&!t.invalidMonth&&!t.invalidWeekday&&!t.weekdayMismatch&&!t.nullInput&&!t.invalidFormat&&!t.userInvalidated&&(!t.meridiem||t.meridiem&&n);if(e._strict&&(s=s&&0===t.charsLeftOver&&0===t.unusedTokens.length&&void 0===t.bigHour),null!=Object.isFrozen&&Object.isFrozen(e))return s;e._isValid=s}return e._isValid}function v(e){var t=y(NaN);return null!=e?_(g(t),e):g(t).userInvalidated=!0,t}i=Array.prototype.some?Array.prototype.some:function(e){for(var t=Object(this),n=t.length>>>0,s=0;s<n;s++)if(s in t&&e.call(this,t[s],s,t))return!0;return!1};var r=c.customMomentProperties=[];function w(e,t){var n,s,i;if(l(t._isAMomentObject)||(e._isAMomentObject=t._isAMomentObject),l(t._i)||(e._i=t._i),l(t._f)||(e._f=t._f),l(t._l)||(e._l=t._l),l(t._strict)||(e._strict=t._strict),l(t._tzm)||(e._tzm=t._tzm),l(t._isUTC)||(e._isUTC=t._isUTC),l(t._offset)||(e._offset=t._offset),l(t._pf)||(e._pf=g(t)),l(t._locale)||(e._locale=t._locale),0<r.length)for(n=0;n<r.length;n++)l(i=t[s=r[n]])||(e[s]=i);return e}var t=!1;function M(e){w(this,e),this._d=new Date(null!=e._d?e._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),!1===t&&(t=!0,c.updateOffset(this),t=!1)}function S(e){return e instanceof M||null!=e&&null!=e._isAMomentObject}function D(e){return e<0?Math.ceil(e)||0:Math.floor(e)}function k(e){var t=+e,n=0;return 0!==t&&isFinite(t)&&(n=D(t)),n}function a(e,t,n){var s,i=Math.min(e.length,t.length),r=Math.abs(e.length-t.length),a=0;for(s=0;s<i;s++)(n&&e[s]!==t[s]||!n&&k(e[s])!==k(t[s]))&&a++;return a+r}function Y(e){!1===c.suppressDeprecationWarnings&&"undefined"!=typeof console&&console.warn&&s.warn("Deprecation warning: "+e)}function n(i,r){var a=!0;return _(function(){if(null!=c.deprecationHandler&&c.deprecationHandler(null,i),a){for(var e,t=[],n=0;n<arguments.length;n++){if(e="","object"==typeof arguments[n]){for(var s in e+="\n["+n+"] ",arguments[0])e+=s+": "+arguments[0][s]+", ";e=e.slice(0,-2)}else e=arguments[n];t.push(e)}Y(i+"\nArguments: "+Array.prototype.slice.call(t).join("")+"\n"+(new Error).stack),a=!1}return r.apply(this,arguments)},r)}var s,O={};function T(e,t){null!=c.deprecationHandler&&c.deprecationHandler(e,t),O[e]||(Y(t),O[e]=!0)}function x(e){return e instanceof Function||"[object Function]"===Object.prototype.toString.call(e)}function b(e,t){var n,s=_({},e);for(n in t)m(t,n)&&(u(e[n])&&u(t[n])?(s[n]={},_(s[n],e[n]),_(s[n],t[n])):null!=t[n]?s[n]=t[n]:delete s[n]);for(n in e)m(e,n)&&!m(t,n)&&u(e[n])&&(s[n]=_({},s[n]));return s}function P(e){null!=e&&this.set(e)}c.suppressDeprecationWarnings=!1,c.deprecationHandler=null,s=Object.keys?Object.keys:function(e){var t,n=[];for(t in e)m(e,t)&&n.push(t);return n};var W={};function H(e,t){var n=e.toLowerCase();W[n]=W[n+"s"]=W[t]=e}function R(e){return"string"==typeof e?W[e]||W[e.toLowerCase()]:void 0}function C(e){var t,n,s={};for(n in e)m(e,n)&&(t=R(n))&&(s[t]=e[n]);return s}var F={};function L(e,t){F[e]=t}function U(e,t,n){var s=""+Math.abs(e),i=t-s.length;return(0<=e?n?"+":"":"-")+Math.pow(10,Math.max(0,i)).toString().substr(1)+s}var N=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,G=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,V={},E={};function I(e,t,n,s){var i=s;"string"==typeof s&&(i=function(){return this[s]()}),e&&(E[e]=i),t&&(E[t[0]]=function(){return U(i.apply(this,arguments),t[1],t[2])}),n&&(E[n]=function(){return this.localeData().ordinal(i.apply(this,arguments),e)})}function A(e,t){return e.isValid()?(t=j(t,e.localeData()),V[t]=V[t]||function(s){var e,i,t,r=s.match(N);for(e=0,i=r.length;e<i;e++)E[r[e]]?r[e]=E[r[e]]:r[e]=(t=r[e]).match(/\[[\s\S]/)?t.replace(/^\[|\]$/g,""):t.replace(/\\/g,"");return function(e){var t,n="";for(t=0;t<i;t++)n+=x(r[t])?r[t].call(e,s):r[t];return n}}(t),V[t](e)):e.localeData().invalidDate()}function j(e,t){var n=5;function s(e){return t.longDateFormat(e)||e}for(G.lastIndex=0;0<=n&&G.test(e);)e=e.replace(G,s),G.lastIndex=0,n-=1;return e}var Z=/\d/,z=/\d\d/,$=/\d{3}/,q=/\d{4}/,J=/[+-]?\d{6}/,B=/\d\d?/,Q=/\d\d\d\d?/,X=/\d\d\d\d\d\d?/,K=/\d{1,3}/,ee=/\d{1,4}/,te=/[+-]?\d{1,6}/,ne=/\d+/,se=/[+-]?\d+/,ie=/Z|[+-]\d\d:?\d\d/gi,re=/Z|[+-]\d\d(?::?\d\d)?/gi,ae=/[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,oe={};function ue(e,n,s){oe[e]=x(n)?n:function(e,t){return e&&s?s:n}}function le(e,t){return m(oe,e)?oe[e](t._strict,t._locale):new RegExp(de(e.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(e,t,n,s,i){return t||n||s||i})))}function de(e){return e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}var he={};function ce(e,n){var t,s=n;for("string"==typeof e&&(e=[e]),d(n)&&(s=function(e,t){t[n]=k(e)}),t=0;t<e.length;t++)he[e[t]]=s}function fe(e,i){ce(e,function(e,t,n,s){n._w=n._w||{},i(e,n._w,n,s)})}var me=0,_e=1,ye=2,ge=3,pe=4,ve=5,we=6,Me=7,Se=8;function De(e){return ke(e)?366:365}function ke(e){return e%4==0&&e%100!=0||e%400==0}I("Y",0,0,function(){var e=this.year();return e<=9999?""+e:"+"+e}),I(0,["YY",2],0,function(){return this.year()%100}),I(0,["YYYY",4],0,"year"),I(0,["YYYYY",5],0,"year"),I(0,["YYYYYY",6,!0],0,"year"),H("year","y"),L("year",1),ue("Y",se),ue("YY",B,z),ue("YYYY",ee,q),ue("YYYYY",te,J),ue("YYYYYY",te,J),ce(["YYYYY","YYYYYY"],me),ce("YYYY",function(e,t){t[me]=2===e.length?c.parseTwoDigitYear(e):k(e)}),ce("YY",function(e,t){t[me]=c.parseTwoDigitYear(e)}),ce("Y",function(e,t){t[me]=parseInt(e,10)}),c.parseTwoDigitYear=function(e){return k(e)+(68<k(e)?1900:2e3)};var Ye,Oe=Te("FullYear",!0);function Te(t,n){return function(e){return null!=e?(be(this,t,e),c.updateOffset(this,n),this):xe(this,t)}}function xe(e,t){return e.isValid()?e._d["get"+(e._isUTC?"UTC":"")+t]():NaN}function be(e,t,n){e.isValid()&&!isNaN(n)&&("FullYear"===t&&ke(e.year())&&1===e.month()&&29===e.date()?e._d["set"+(e._isUTC?"UTC":"")+t](n,e.month(),Pe(n,e.month())):e._d["set"+(e._isUTC?"UTC":"")+t](n))}function Pe(e,t){if(isNaN(e)||isNaN(t))return NaN;var n,s=(t%(n=12)+n)%n;return e+=(t-s)/12,1===s?ke(e)?29:28:31-s%7%2}Ye=Array.prototype.indexOf?Array.prototype.indexOf:function(e){var t;for(t=0;t<this.length;++t)if(this[t]===e)return t;return-1},I("M",["MM",2],"Mo",function(){return this.month()+1}),I("MMM",0,0,function(e){return this.localeData().monthsShort(this,e)}),I("MMMM",0,0,function(e){return this.localeData().months(this,e)}),H("month","M"),L("month",8),ue("M",B),ue("MM",B,z),ue("MMM",function(e,t){return t.monthsShortRegex(e)}),ue("MMMM",function(e,t){return t.monthsRegex(e)}),ce(["M","MM"],function(e,t){t[_e]=k(e)-1}),ce(["MMM","MMMM"],function(e,t,n,s){var i=n._locale.monthsParse(e,s,n._strict);null!=i?t[_e]=i:g(n).invalidMonth=e});var We=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,He="January_February_March_April_May_June_July_August_September_October_November_December".split("_");var Re="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");function Ce(e,t){var n;if(!e.isValid())return e;if("string"==typeof t)if(/^\d+$/.test(t))t=k(t);else if(!d(t=e.localeData().monthsParse(t)))return e;return n=Math.min(e.date(),Pe(e.year(),t)),e._d["set"+(e._isUTC?"UTC":"")+"Month"](t,n),e}function Fe(e){return null!=e?(Ce(this,e),c.updateOffset(this,!0),this):xe(this,"Month")}var Le=ae;var Ue=ae;function Ne(){function e(e,t){return t.length-e.length}var t,n,s=[],i=[],r=[];for(t=0;t<12;t++)n=y([2e3,t]),s.push(this.monthsShort(n,"")),i.push(this.months(n,"")),r.push(this.months(n,"")),r.push(this.monthsShort(n,""));for(s.sort(e),i.sort(e),r.sort(e),t=0;t<12;t++)s[t]=de(s[t]),i[t]=de(i[t]);for(t=0;t<24;t++)r[t]=de(r[t]);this._monthsRegex=new RegExp("^("+r.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+s.join("|")+")","i")}function Ge(e){var t=new Date(Date.UTC.apply(null,arguments));return e<100&&0<=e&&isFinite(t.getUTCFullYear())&&t.setUTCFullYear(e),t}function Ve(e,t,n){var s=7+t-n;return-((7+Ge(e,0,s).getUTCDay()-t)%7)+s-1}function Ee(e,t,n,s,i){var r,a,o=1+7*(t-1)+(7+n-s)%7+Ve(e,s,i);return o<=0?a=De(r=e-1)+o:o>De(e)?(r=e+1,a=o-De(e)):(r=e,a=o),{year:r,dayOfYear:a}}function Ie(e,t,n){var s,i,r=Ve(e.year(),t,n),a=Math.floor((e.dayOfYear()-r-1)/7)+1;return a<1?s=a+Ae(i=e.year()-1,t,n):a>Ae(e.year(),t,n)?(s=a-Ae(e.year(),t,n),i=e.year()+1):(i=e.year(),s=a),{week:s,year:i}}function Ae(e,t,n){var s=Ve(e,t,n),i=Ve(e+1,t,n);return(De(e)-s+i)/7}I("w",["ww",2],"wo","week"),I("W",["WW",2],"Wo","isoWeek"),H("week","w"),H("isoWeek","W"),L("week",5),L("isoWeek",5),ue("w",B),ue("ww",B,z),ue("W",B),ue("WW",B,z),fe(["w","ww","W","WW"],function(e,t,n,s){t[s.substr(0,1)]=k(e)});I("d",0,"do","day"),I("dd",0,0,function(e){return this.localeData().weekdaysMin(this,e)}),I("ddd",0,0,function(e){return this.localeData().weekdaysShort(this,e)}),I("dddd",0,0,function(e){return this.localeData().weekdays(this,e)}),I("e",0,0,"weekday"),I("E",0,0,"isoWeekday"),H("day","d"),H("weekday","e"),H("isoWeekday","E"),L("day",11),L("weekday",11),L("isoWeekday",11),ue("d",B),ue("e",B),ue("E",B),ue("dd",function(e,t){return t.weekdaysMinRegex(e)}),ue("ddd",function(e,t){return t.weekdaysShortRegex(e)}),ue("dddd",function(e,t){return t.weekdaysRegex(e)}),fe(["dd","ddd","dddd"],function(e,t,n,s){var i=n._locale.weekdaysParse(e,s,n._strict);null!=i?t.d=i:g(n).invalidWeekday=e}),fe(["d","e","E"],function(e,t,n,s){t[s]=k(e)});var je="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_");var Ze="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_");var ze="Su_Mo_Tu_We_Th_Fr_Sa".split("_");var $e=ae;var qe=ae;var Je=ae;function Be(){function e(e,t){return t.length-e.length}var t,n,s,i,r,a=[],o=[],u=[],l=[];for(t=0;t<7;t++)n=y([2e3,1]).day(t),s=this.weekdaysMin(n,""),i=this.weekdaysShort(n,""),r=this.weekdays(n,""),a.push(s),o.push(i),u.push(r),l.push(s),l.push(i),l.push(r);for(a.sort(e),o.sort(e),u.sort(e),l.sort(e),t=0;t<7;t++)o[t]=de(o[t]),u[t]=de(u[t]),l[t]=de(l[t]);this._weekdaysRegex=new RegExp("^("+l.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+u.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+o.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+a.join("|")+")","i")}function Qe(){return this.hours()%12||12}function Xe(e,t){I(e,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),t)})}function Ke(e,t){return t._meridiemParse}I("H",["HH",2],0,"hour"),I("h",["hh",2],0,Qe),I("k",["kk",2],0,function(){return this.hours()||24}),I("hmm",0,0,function(){return""+Qe.apply(this)+U(this.minutes(),2)}),I("hmmss",0,0,function(){return""+Qe.apply(this)+U(this.minutes(),2)+U(this.seconds(),2)}),I("Hmm",0,0,function(){return""+this.hours()+U(this.minutes(),2)}),I("Hmmss",0,0,function(){return""+this.hours()+U(this.minutes(),2)+U(this.seconds(),2)}),Xe("a",!0),Xe("A",!1),H("hour","h"),L("hour",13),ue("a",Ke),ue("A",Ke),ue("H",B),ue("h",B),ue("k",B),ue("HH",B,z),ue("hh",B,z),ue("kk",B,z),ue("hmm",Q),ue("hmmss",X),ue("Hmm",Q),ue("Hmmss",X),ce(["H","HH"],ge),ce(["k","kk"],function(e,t,n){var s=k(e);t[ge]=24===s?0:s}),ce(["a","A"],function(e,t,n){n._isPm=n._locale.isPM(e),n._meridiem=e}),ce(["h","hh"],function(e,t,n){t[ge]=k(e),g(n).bigHour=!0}),ce("hmm",function(e,t,n){var s=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s)),g(n).bigHour=!0}),ce("hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s,2)),t[ve]=k(e.substr(i)),g(n).bigHour=!0}),ce("Hmm",function(e,t,n){var s=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s))}),ce("Hmmss",function(e,t,n){var s=e.length-4,i=e.length-2;t[ge]=k(e.substr(0,s)),t[pe]=k(e.substr(s,2)),t[ve]=k(e.substr(i))});var et,tt=Te("Hours",!0),nt={calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},longDateFormat:{LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},invalidDate:"Invalid date",ordinal:"%d",dayOfMonthOrdinalParse:/\d{1,2}/,relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},months:He,monthsShort:Re,week:{dow:0,doy:6},weekdays:je,weekdaysMin:ze,weekdaysShort:Ze,meridiemParse:/[ap]\.?m?\.?/i},st={},it={};function rt(e){return e?e.toLowerCase().replace("_","-"):e}function at(e){var t=null;if(!st[e]&&"undefined"!=typeof module&&module&&module.exports)try{t=et._abbr,require("./locale/"+e),ot(t)}catch(e){}return st[e]}function ot(e,t){var n;return e&&((n=l(t)?lt(e):ut(e,t))?et=n:"undefined"!=typeof console&&console.warn&&console.warn("Locale "+e+" not found. Did you forget to load it?")),et._abbr}function ut(e,t){if(null!==t){var n,s=nt;if(t.abbr=e,null!=st[e])T("defineLocaleOverride","use customMoment.updateLocale(localeName, config) to change an existing locale. customMoment.defineLocale(localeName, config) should only be used for creating a new locale See http://customMomentjs.com/guides/#/warnings/define-locale/ for more info."),s=st[e]._config;else if(null!=t.parentLocale)if(null!=st[t.parentLocale])s=st[t.parentLocale]._config;else{if(null==(n=at(t.parentLocale)))return it[t.parentLocale]||(it[t.parentLocale]=[]),it[t.parentLocale].push({name:e,config:t}),null;s=n._config}return st[e]=new P(b(s,t)),it[e]&&it[e].forEach(function(e){ut(e.name,e.config)}),ot(e),st[e]}return delete st[e],null}function lt(e){var t;if(e&&e._locale&&e._locale._abbr&&(e=e._locale._abbr),!e)return et;if(!o(e)){if(t=at(e))return t;e=[e]}return function(e){for(var t,n,s,i,r=0;r<e.length;){for(t=(i=rt(e[r]).split("-")).length,n=(n=rt(e[r+1]))?n.split("-"):null;0<t;){if(s=at(i.slice(0,t).join("-")))return s;if(n&&n.length>=t&&a(i,n,!0)>=t-1)break;t--}r++}return et}(e)}function dt(e){var t,n=e._a;return n&&-2===g(e).overflow&&(t=n[_e]<0||11<n[_e]?_e:n[ye]<1||n[ye]>Pe(n[me],n[_e])?ye:n[ge]<0||24<n[ge]||24===n[ge]&&(0!==n[pe]||0!==n[ve]||0!==n[we])?ge:n[pe]<0||59<n[pe]?pe:n[ve]<0||59<n[ve]?ve:n[we]<0||999<n[we]?we:-1,g(e)._overflowDayOfYear&&(t<me||ye<t)&&(t=ye),g(e)._overflowWeeks&&-1===t&&(t=Me),g(e)._overflowWeekday&&-1===t&&(t=Se),g(e).overflow=t),e}function ht(e,t,n){return null!=e?e:null!=t?t:n}function ct(e){var t,n,s,i,r,a=[];if(!e._d){var o,u;for(o=e,u=new Date(c.now()),s=o._useUTC?[u.getUTCFullYear(),u.getUTCMonth(),u.getUTCDate()]:[u.getFullYear(),u.getMonth(),u.getDate()],e._w&&null==e._a[ye]&&null==e._a[_e]&&function(e){var t,n,s,i,r,a,o,u;if(null!=(t=e._w).GG||null!=t.W||null!=t.E)r=1,a=4,n=ht(t.GG,e._a[me],Ie(Tt(),1,4).year),s=ht(t.W,1),((i=ht(t.E,1))<1||7<i)&&(u=!0);else{r=e._locale._week.dow,a=e._locale._week.doy;var l=Ie(Tt(),r,a);n=ht(t.gg,e._a[me],l.year),s=ht(t.w,l.week),null!=t.d?((i=t.d)<0||6<i)&&(u=!0):null!=t.e?(i=t.e+r,(t.e<0||6<t.e)&&(u=!0)):i=r}s<1||s>Ae(n,r,a)?g(e)._overflowWeeks=!0:null!=u?g(e)._overflowWeekday=!0:(o=Ee(n,s,i,r,a),e._a[me]=o.year,e._dayOfYear=o.dayOfYear)}(e),null!=e._dayOfYear&&(r=ht(e._a[me],s[me]),(e._dayOfYear>De(r)||0===e._dayOfYear)&&(g(e)._overflowDayOfYear=!0),n=Ge(r,0,e._dayOfYear),e._a[_e]=n.getUTCMonth(),e._a[ye]=n.getUTCDate()),t=0;t<3&&null==e._a[t];++t)e._a[t]=a[t]=s[t];for(;t<7;t++)e._a[t]=a[t]=null==e._a[t]?2===t?1:0:e._a[t];24===e._a[ge]&&0===e._a[pe]&&0===e._a[ve]&&0===e._a[we]&&(e._nextDay=!0,e._a[ge]=0),e._d=(e._useUTC?Ge:function(e,t,n,s,i,r,a){var o=new Date(e,t,n,s,i,r,a);return e<100&&0<=e&&isFinite(o.getFullYear())&&o.setFullYear(e),o}).apply(null,a),i=e._useUTC?e._d.getUTCDay():e._d.getDay(),null!=e._tzm&&e._d.setUTCMinutes(e._d.getUTCMinutes()-e._tzm),e._nextDay&&(e._a[ge]=24),e._w&&void 0!==e._w.d&&e._w.d!==i&&(g(e).weekdayMismatch=!0)}}var ft=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,mt=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,_t=/Z|[+-]\d\d(?::?\d\d)?/,yt=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],gt=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],pt=/^\/?Date\((\-?\d+)/i;function vt(e){var t,n,s,i,r,a,o=e._i,u=ft.exec(o)||mt.exec(o);if(u){for(g(e).iso=!0,t=0,n=yt.length;t<n;t++)if(yt[t][1].exec(u[1])){i=yt[t][0],s=!1!==yt[t][2];break}if(null==i)return void(e._isValid=!1);if(u[3]){for(t=0,n=gt.length;t<n;t++)if(gt[t][1].exec(u[3])){r=(u[2]||" ")+gt[t][0];break}if(null==r)return void(e._isValid=!1)}if(!s&&null!=r)return void(e._isValid=!1);if(u[4]){if(!_t.exec(u[4]))return void(e._isValid=!1);a="Z"}e._f=i+(r||"")+(a||""),kt(e)}else e._isValid=!1}var wt=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;function Mt(e,t,n,s,i,r){var a=[function(e){var t=parseInt(e,10);{if(t<=49)return 2e3+t;if(t<=999)return 1900+t}return t}(e),Re.indexOf(t),parseInt(n,10),parseInt(s,10),parseInt(i,10)];return r&&a.push(parseInt(r,10)),a}var St={UT:0,GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function Dt(e){var t,n,s,i=wt.exec(e._i.replace(/\([^)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s\s*/,"").replace(/\s\s*$/,""));if(i){var r=Mt(i[4],i[3],i[2],i[5],i[6],i[7]);if(t=i[1],n=r,s=e,t&&Ze.indexOf(t)!==new Date(n[0],n[1],n[2]).getDay()&&(g(s).weekdayMismatch=!0,!(s._isValid=!1)))return;e._a=r,e._tzm=function(e,t,n){if(e)return St[e];if(t)return 0;var s=parseInt(n,10),i=s%100;return(s-i)/100*60+i}(i[8],i[9],i[10]),e._d=Ge.apply(null,e._a),e._d.setUTCMinutes(e._d.getUTCMinutes()-e._tzm),g(e).rfc2822=!0}else e._isValid=!1}function kt(e){if(e._f!==c.ISO_8601)if(e._f!==c.RFC_2822){e._a=[],g(e).empty=!0;var t,n,s,i,r,a,o,u,l=""+e._i,d=l.length,h=0;for(s=j(e._f,e._locale).match(N)||[],t=0;t<s.length;t++)i=s[t],(n=(l.match(le(i,e))||[])[0])&&(0<(r=l.substr(0,l.indexOf(n))).length&&g(e).unusedInput.push(r),l=l.slice(l.indexOf(n)+n.length),h+=n.length),E[i]?(n?g(e).empty=!1:g(e).unusedTokens.push(i),a=i,u=e,null!=(o=n)&&m(he,a)&&he[a](o,u._a,u,a)):e._strict&&!n&&g(e).unusedTokens.push(i);g(e).charsLeftOver=d-h,0<l.length&&g(e).unusedInput.push(l),e._a[ge]<=12&&!0===g(e).bigHour&&0<e._a[ge]&&(g(e).bigHour=void 0),g(e).parsedDateParts=e._a.slice(0),g(e).meridiem=e._meridiem,e._a[ge]=function(e,t,n){var s;if(null==n)return t;return null!=e.meridiemHour?e.meridiemHour(t,n):(null!=e.isPM&&((s=e.isPM(n))&&t<12&&(t+=12),s||12!==t||(t=0)),t)}(e._locale,e._a[ge],e._meridiem),ct(e),dt(e)}else Dt(e);else vt(e)}function Yt(e){var t,n,s,i,r=e._i,a=e._f;return e._locale=e._locale||lt(e._l),null===r||void 0===a&&""===r?v({nullInput:!0}):("string"==typeof r&&(e._i=r=e._locale.preparse(r)),S(r)?new M(dt(r)):(h(r)?e._d=r:o(a)?function(e){var t,n,s,i,r;if(0===e._f.length)return g(e).invalidFormat=!0,e._d=new Date(NaN);for(i=0;i<e._f.length;i++)r=0,t=w({},e),null!=e._useUTC&&(t._useUTC=e._useUTC),t._f=e._f[i],kt(t),p(t)&&(r+=g(t).charsLeftOver,r+=10*g(t).unusedTokens.length,g(t).score=r,(null==s||r<s)&&(s=r,n=t));_(e,n||t)}(e):a?kt(e):l(n=(t=e)._i)?t._d=new Date(c.now()):h(n)?t._d=new Date(n.valueOf()):"string"==typeof n?(s=t,null===(i=pt.exec(s._i))?(vt(s),!1===s._isValid&&(delete s._isValid,Dt(s),!1===s._isValid&&(delete s._isValid,c.createFromInputFallback(s)))):s._d=new Date(+i[1])):o(n)?(t._a=f(n.slice(0),function(e){return parseInt(e,10)}),ct(t)):u(n)?function(e){if(!e._d){var t=C(e._i);e._a=f([t.year,t.month,t.day||t.date,t.hour,t.minute,t.second,t.millisecond],function(e){return e&&parseInt(e,10)}),ct(e)}}(t):d(n)?t._d=new Date(n):c.createFromInputFallback(t),p(e)||(e._d=null),e))}function Ot(e,t,n,s,i){var r,a={};return!0!==n&&!1!==n||(s=n,n=void 0),(u(e)&&function(e){if(Object.getOwnPropertyNames)return 0===Object.getOwnPropertyNames(e).length;var t;for(t in e)if(e.hasOwnProperty(t))return!1;return!0}(e)||o(e)&&0===e.length)&&(e=void 0),a._isAMomentObject=!0,a._useUTC=a._isUTC=i,a._l=n,a._i=e,a._f=t,a._strict=s,(r=new M(dt(Yt(a))))._nextDay&&(r.add(1,"d"),r._nextDay=void 0),r}function Tt(e,t,n,s){return Ot(e,t,n,s,!1)}c.createFromInputFallback=n("value provided is not in a recognized RFC2822 or ISO format. customMoment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://customMomentjs.com/guides/#/warnings/js-date/ for more info.",function(e){e._d=new Date(e._i+(e._useUTC?" UTC":""))}),c.ISO_8601=function(){},c.RFC_2822=function(){};var xt=n("customMoment().min is deprecated, use customMoment.max instead. http://customMomentjs.com/guides/#/warnings/min-max/",function(){var e=Tt.apply(null,arguments);return this.isValid()&&e.isValid()?e<this?this:e:v()}),bt=n("customMoment().max is deprecated, use customMoment.min instead. http://customMomentjs.com/guides/#/warnings/min-max/",function(){var e=Tt.apply(null,arguments);return this.isValid()&&e.isValid()?this<e?this:e:v()});function Pt(e,t){var n,s;if(1===t.length&&o(t[0])&&(t=t[0]),!t.length)return Tt();for(n=t[0],s=1;s<t.length;++s)t[s].isValid()&&!t[s][e](n)||(n=t[s]);return n}var Wt=["year","quarter","month","week","day","hour","minute","second","millisecond"];function Ht(e){var t=C(e),n=t.year||0,s=t.quarter||0,i=t.month||0,r=t.week||0,a=t.day||0,o=t.hour||0,u=t.minute||0,l=t.second||0,d=t.millisecond||0;this._isValid=function(e){for(var t in e)if(-1===Ye.call(Wt,t)||null!=e[t]&&isNaN(e[t]))return!1;for(var n=!1,s=0;s<Wt.length;++s)if(e[Wt[s]]){if(n)return!1;parseFloat(e[Wt[s]])!==k(e[Wt[s]])&&(n=!0)}return!0}(t),this._milliseconds=+d+1e3*l+6e4*u+1e3*o*60*60,this._days=+a+7*r,this._months=+i+3*s+12*n,this._data={},this._locale=lt(),this._bubble()}function Rt(e){return e instanceof Ht}function Ct(e){return e<0?-1*Math.round(-1*e):Math.round(e)}function Ft(e,n){I(e,0,0,function(){var e=this.utcOffset(),t="+";return e<0&&(e=-e,t="-"),t+U(~~(e/60),2)+n+U(~~e%60,2)})}Ft("Z",":"),Ft("ZZ",""),ue("Z",re),ue("ZZ",re),ce(["Z","ZZ"],function(e,t,n){n._useUTC=!0,n._tzm=Ut(re,e)});var Lt=/([\+\-]|\d\d)/gi;function Ut(e,t){var n=(t||"").match(e);if(null===n)return null;var s=((n[n.length-1]||[])+"").match(Lt)||["-",0,0],i=60*s[1]+k(s[2]);return 0===i?0:"+"===s[0]?i:-i}function Nt(e,t){var n,s;return t._isUTC?(n=t.clone(),s=(S(e)||h(e)?e.valueOf():Tt(e).valueOf())-n.valueOf(),n._d.setTime(n._d.valueOf()+s),c.updateOffset(n,!1),n):Tt(e).local()}function Gt(e){return 15*-Math.round(e._d.getTimezoneOffset()/15)}function Vt(){return!!this.isValid()&&(this._isUTC&&0===this._offset)}c.updateOffset=function(){};var Et=/^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,It=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;function At(e,t){var n,s,i,r=e,a=null;return Rt(e)?r={ms:e._milliseconds,d:e._days,M:e._months}:d(e)?(r={},t?r[t]=e:r.milliseconds=e):(a=Et.exec(e))?(n="-"===a[1]?-1:1,r={y:0,d:k(a[ye])*n,h:k(a[ge])*n,m:k(a[pe])*n,s:k(a[ve])*n,ms:k(Ct(1e3*a[we]))*n}):(a=It.exec(e))?(n="-"===a[1]?-1:(a[1],1),r={y:jt(a[2],n),M:jt(a[3],n),w:jt(a[4],n),d:jt(a[5],n),h:jt(a[6],n),m:jt(a[7],n),s:jt(a[8],n)}):null==r?r={}:"object"==typeof r&&("from"in r||"to"in r)&&(i=function(e,t){var n;if(!e.isValid()||!t.isValid())return{milliseconds:0,months:0};t=Nt(t,e),e.isBefore(t)?n=Zt(e,t):((n=Zt(t,e)).milliseconds=-n.milliseconds,n.months=-n.months);return n}(Tt(r.from),Tt(r.to)),(r={}).ms=i.milliseconds,r.M=i.months),s=new Ht(r),Rt(e)&&m(e,"_locale")&&(s._locale=e._locale),s}function jt(e,t){var n=e&&parseFloat(e.replace(",","."));return(isNaN(n)?0:n)*t}function Zt(e,t){var n={milliseconds:0,months:0};return n.months=t.month()-e.month()+12*(t.year()-e.year()),e.clone().add(n.months,"M").isAfter(t)&&--n.months,n.milliseconds=+t-+e.clone().add(n.months,"M"),n}function zt(s,i){return function(e,t){var n;return null===t||isNaN(+t)||(T(i,"customMoment()."+i+"(period, number) is deprecated. Please use customMoment()."+i+"(number, period). See http://customMomentjs.com/guides/#/warnings/add-inverted-param/ for more info."),n=e,e=t,t=n),$t(this,At(e="string"==typeof e?+e:e,t),s),this}}function $t(e,t,n,s){var i=t._milliseconds,r=Ct(t._days),a=Ct(t._months);e.isValid()&&(s=null==s||s,a&&Ce(e,xe(e,"Month")+a*n),r&&be(e,"Date",xe(e,"Date")+r*n),i&&e._d.setTime(e._d.valueOf()+i*n),s&&c.updateOffset(e,r||a))}At.fn=Ht.prototype,At.invalid=function(){return At(NaN)};var qt=zt(1,"add"),Jt=zt(-1,"subtract");function Bt(e,t){var n=12*(t.year()-e.year())+(t.month()-e.month()),s=e.clone().add(n,"months");return-(n+(t-s<0?(t-s)/(s-e.clone().add(n-1,"months")):(t-s)/(e.clone().add(n+1,"months")-s)))||0}function Qt(e){var t;return void 0===e?this._locale._abbr:(null!=(t=lt(e))&&(this._locale=t),this)}c.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",c.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var Xt=n("customMoment().lang() is deprecated. Instead, use customMoment().localeData() to get the language configuration. Use customMoment().locale() to change languages.",function(e){return void 0===e?this.localeData():this.locale(e)});function Kt(){return this._locale}function en(e,t){I(0,[e,e.length],0,t)}function tn(e,t,n,s,i){var r;return null==e?Ie(this,s,i).year:((r=Ae(e,s,i))<t&&(t=r),function(e,t,n,s,i){var r=Ee(e,t,n,s,i),a=Ge(r.year,0,r.dayOfYear);return this.year(a.getUTCFullYear()),this.month(a.getUTCMonth()),this.date(a.getUTCDate()),this}.call(this,e,t,n,s,i))}I(0,["gg",2],0,function(){return this.weekYear()%100}),I(0,["GG",2],0,function(){return this.isoWeekYear()%100}),en("gggg","weekYear"),en("ggggg","weekYear"),en("GGGG","isoWeekYear"),en("GGGGG","isoWeekYear"),H("weekYear","gg"),H("isoWeekYear","GG"),L("weekYear",1),L("isoWeekYear",1),ue("G",se),ue("g",se),ue("GG",B,z),ue("gg",B,z),ue("GGGG",ee,q),ue("gggg",ee,q),ue("GGGGG",te,J),ue("ggggg",te,J),fe(["gggg","ggggg","GGGG","GGGGG"],function(e,t,n,s){t[s.substr(0,2)]=k(e)}),fe(["gg","GG"],function(e,t,n,s){t[s]=c.parseTwoDigitYear(e)}),I("Q",0,"Qo","quarter"),H("quarter","Q"),L("quarter",7),ue("Q",Z),ce("Q",function(e,t){t[_e]=3*(k(e)-1)}),I("D",["DD",2],"Do","date"),H("date","D"),L("date",9),ue("D",B),ue("DD",B,z),ue("Do",function(e,t){return e?t._dayOfMonthOrdinalParse||t._ordinalParse:t._dayOfMonthOrdinalParseLenient}),ce(["D","DD"],ye),ce("Do",function(e,t){t[ye]=k(e.match(B)[0])});var nn=Te("Date",!0);I("DDD",["DDDD",3],"DDDo","dayOfYear"),H("dayOfYear","DDD"),L("dayOfYear",4),ue("DDD",K),ue("DDDD",$),ce(["DDD","DDDD"],function(e,t,n){n._dayOfYear=k(e)}),I("m",["mm",2],0,"minute"),H("minute","m"),L("minute",14),ue("m",B),ue("mm",B,z),ce(["m","mm"],pe);var sn=Te("Minutes",!1);I("s",["ss",2],0,"second"),H("second","s"),L("second",15),ue("s",B),ue("ss",B,z),ce(["s","ss"],ve);var rn,an=Te("Seconds",!1);for(I("S",0,0,function(){return~~(this.millisecond()/100)}),I(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),I(0,["SSS",3],0,"millisecond"),I(0,["SSSS",4],0,function(){return 10*this.millisecond()}),I(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),I(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),I(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),I(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),I(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),H("millisecond","ms"),L("millisecond",16),ue("S",K,Z),ue("SS",K,z),ue("SSS",K,$),rn="SSSS";rn.length<=9;rn+="S")ue(rn,ne);function on(e,t){t[we]=k(1e3*("0."+e))}for(rn="S";rn.length<=9;rn+="S")ce(rn,on);var un=Te("Milliseconds",!1);I("z",0,0,"zoneAbbr"),I("zz",0,0,"zoneName");var ln=M.prototype;function dn(e){return e}ln.add=qt,ln.calendar=function(e,t){var n=e||Tt(),s=Nt(n,this).startOf("day"),i=c.calendarFormat(this,s)||"sameElse",r=t&&(x(t[i])?t[i].call(this,n):t[i]);return this.format(r||this.localeData().calendar(i,this,Tt(n)))},ln.clone=function(){return new M(this)},ln.diff=function(e,t,n){var s,i,r;if(!this.isValid())return NaN;if(!(s=Nt(e,this)).isValid())return NaN;switch(i=6e4*(s.utcOffset()-this.utcOffset()),t=R(t)){case"year":r=Bt(this,s)/12;break;case"month":r=Bt(this,s);break;case"quarter":r=Bt(this,s)/3;break;case"second":r=(this-s)/1e3;break;case"minute":r=(this-s)/6e4;break;case"hour":r=(this-s)/36e5;break;case"day":r=(this-s-i)/864e5;break;case"week":r=(this-s-i)/6048e5;break;default:r=this-s}return n?r:D(r)},ln.endOf=function(e){return void 0===(e=R(e))||"millisecond"===e?this:("date"===e&&(e="day"),this.startOf(e).add(1,"isoWeek"===e?"week":e).subtract(1,"ms"))},ln.format=function(e){e||(e=this.isUtc()?c.defaultFormatUtc:c.defaultFormat);var t=A(this,e);return this.localeData().postformat(t)},ln.from=function(e,t){return this.isValid()&&(S(e)&&e.isValid()||Tt(e).isValid())?At({to:this,from:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()},ln.fromNow=function(e){return this.from(Tt(),e)},ln.to=function(e,t){return this.isValid()&&(S(e)&&e.isValid()||Tt(e).isValid())?At({from:this,to:e}).locale(this.locale()).humanize(!t):this.localeData().invalidDate()},ln.toNow=function(e){return this.to(Tt(),e)},ln.get=function(e){return x(this[e=R(e)])?this[e]():this},ln.invalidAt=function(){return g(this).overflow},ln.isAfter=function(e,t){var n=S(e)?e:Tt(e);return!(!this.isValid()||!n.isValid())&&("millisecond"===(t=R(l(t)?"millisecond":t))?this.valueOf()>n.valueOf():n.valueOf()<this.clone().startOf(t).valueOf())},ln.isBefore=function(e,t){var n=S(e)?e:Tt(e);return!(!this.isValid()||!n.isValid())&&("millisecond"===(t=R(l(t)?"millisecond":t))?this.valueOf()<n.valueOf():this.clone().endOf(t).valueOf()<n.valueOf())},ln.isBetween=function(e,t,n,s){return("("===(s=s||"()")[0]?this.isAfter(e,n):!this.isBefore(e,n))&&(")"===s[1]?this.isBefore(t,n):!this.isAfter(t,n))},ln.isSame=function(e,t){var n,s=S(e)?e:Tt(e);return!(!this.isValid()||!s.isValid())&&("millisecond"===(t=R(t||"millisecond"))?this.valueOf()===s.valueOf():(n=s.valueOf(),this.clone().startOf(t).valueOf()<=n&&n<=this.clone().endOf(t).valueOf()))},ln.isSameOrAfter=function(e,t){return this.isSame(e,t)||this.isAfter(e,t)},ln.isSameOrBefore=function(e,t){return this.isSame(e,t)||this.isBefore(e,t)},ln.isValid=function(){return p(this)},ln.lang=Xt,ln.locale=Qt,ln.localeData=Kt,ln.max=bt,ln.min=xt,ln.parsingFlags=function(){return _({},g(this))},ln.set=function(e,t){if("object"==typeof e)for(var n=function(e){var t=[];for(var n in e)t.push({unit:n,priority:F[n]});return t.sort(function(e,t){return e.priority-t.priority}),t}(e=C(e)),s=0;s<n.length;s++)this[n[s].unit](e[n[s].unit]);else if(x(this[e=R(e)]))return this[e](t);return this},ln.startOf=function(e){switch(e=R(e)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":case"date":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===e&&this.weekday(0),"isoWeek"===e&&this.isoWeekday(1),"quarter"===e&&this.month(3*Math.floor(this.month()/3)),this},ln.subtract=Jt,ln.toArray=function(){var e=this;return[e.year(),e.month(),e.date(),e.hour(),e.minute(),e.second(),e.millisecond()]},ln.toObject=function(){var e=this;return{years:e.year(),months:e.month(),date:e.date(),hours:e.hours(),minutes:e.minutes(),seconds:e.seconds(),milliseconds:e.milliseconds()}},ln.toDate=function(){return new Date(this.valueOf())},ln.toISOString=function(e){if(!this.isValid())return null;var t=!0!==e,n=t?this.clone().utc():this;return n.year()<0||9999<n.year()?A(n,t?"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"):x(Date.prototype.toISOString)?t?this.toDate().toISOString():new Date(this.valueOf()+60*this.utcOffset()*1e3).toISOString().replace("Z",A(n,"Z")):A(n,t?"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]":"YYYY-MM-DD[T]HH:mm:ss.SSSZ")},ln.inspect=function(){if(!this.isValid())return"customMoment.invalid(/* "+this._i+" */)";var e="customMoment",t="";this.isLocal()||(e=0===this.utcOffset()?"customMoment.utc":"customMoment.parseZone",t="Z");var n="["+e+'("]',s=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",i=t+'[")]';return this.format(n+s+"-MM-DD[T]HH:mm:ss.SSS"+i)},ln.toJSON=function(){return this.isValid()?this.toISOString():null},ln.toString=function(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},ln.unix=function(){return Math.floor(this.valueOf()/1e3)},ln.valueOf=function(){return this._d.valueOf()-6e4*(this._offset||0)},ln.creationData=function(){return{input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}},ln.year=Oe,ln.isLeapYear=function(){return ke(this.year())},ln.weekYear=function(e){return tn.call(this,e,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)},ln.isoWeekYear=function(e){return tn.call(this,e,this.isoWeek(),this.isoWeekday(),1,4)},ln.quarter=ln.quarters=function(e){return null==e?Math.ceil((this.month()+1)/3):this.month(3*(e-1)+this.month()%3)},ln.month=Fe,ln.daysInMonth=function(){return Pe(this.year(),this.month())},ln.week=ln.weeks=function(e){var t=this.localeData().week(this);return null==e?t:this.add(7*(e-t),"d")},ln.isoWeek=ln.isoWeeks=function(e){var t=Ie(this,1,4).week;return null==e?t:this.add(7*(e-t),"d")},ln.weeksInYear=function(){var e=this.localeData()._week;return Ae(this.year(),e.dow,e.doy)},ln.isoWeeksInYear=function(){return Ae(this.year(),1,4)},ln.date=nn,ln.day=ln.days=function(e){if(!this.isValid())return null!=e?this:NaN;var t,n,s=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=e?(t=e,n=this.localeData(),e="string"!=typeof t?t:isNaN(t)?"number"==typeof(t=n.weekdaysParse(t))?t:null:parseInt(t,10),this.add(e-s,"d")):s},ln.weekday=function(e){if(!this.isValid())return null!=e?this:NaN;var t=(this.day()+7-this.localeData()._week.dow)%7;return null==e?t:this.add(e-t,"d")},ln.isoWeekday=function(e){if(!this.isValid())return null!=e?this:NaN;if(null!=e){var t=(n=e,s=this.localeData(),"string"==typeof n?s.weekdaysParse(n)%7||7:isNaN(n)?null:n);return this.day(this.day()%7?t:t-7)}return this.day()||7;var n,s},ln.dayOfYear=function(e){var t=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==e?t:this.add(e-t,"d")},ln.hour=ln.hours=tt,ln.minute=ln.minutes=sn,ln.second=ln.seconds=an,ln.millisecond=ln.milliseconds=un,ln.utcOffset=function(e,t,n){var s,i=this._offset||0;if(!this.isValid())return null!=e?this:NaN;if(null!=e){if("string"==typeof e){if(null===(e=Ut(re,e)))return this}else Math.abs(e)<16&&!n&&(e*=60);return!this._isUTC&&t&&(s=Gt(this)),this._offset=e,this._isUTC=!0,null!=s&&this.add(s,"m"),i!==e&&(!t||this._changeInProgress?$t(this,At(e-i,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,c.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?i:Gt(this)},ln.utc=function(e){return this.utcOffset(0,e)},ln.local=function(e){return this._isUTC&&(this.utcOffset(0,e),this._isUTC=!1,e&&this.subtract(Gt(this),"m")),this},ln.parseZone=function(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var e=Ut(ie,this._i);null!=e?this.utcOffset(e):this.utcOffset(0,!0)}return this},ln.hasAlignedHourOffset=function(e){return!!this.isValid()&&(e=e?Tt(e).utcOffset():0,(this.utcOffset()-e)%60==0)},ln.isDST=function(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()},ln.isLocal=function(){return!!this.isValid()&&!this._isUTC},ln.isUtcOffset=function(){return!!this.isValid()&&this._isUTC},ln.isUtc=Vt,ln.isUTC=Vt,ln.zoneAbbr=function(){return this._isUTC?"UTC":""},ln.zoneName=function(){return this._isUTC?"Coordinated Universal Time":""},ln.dates=n("dates accessor is deprecated. Use date instead.",nn),ln.months=n("months accessor is deprecated. Use month instead",Fe),ln.years=n("years accessor is deprecated. Use year instead",Oe),ln.zone=n("customMoment().zone is deprecated, use customMoment().utcOffset instead. http://customMomentjs.com/guides/#/warnings/zone/",function(e,t){return null!=e?("string"!=typeof e&&(e=-e),this.utcOffset(e,t),this):-this.utcOffset()}),ln.isDSTShifted=n("isDSTShifted is deprecated. See http://customMomentjs.com/guides/#/warnings/dst-shifted/ for more information",function(){if(!l(this._isDSTShifted))return this._isDSTShifted;var e={};if(w(e,this),(e=Yt(e))._a){var t=e._isUTC?y(e._a):Tt(e._a);this._isDSTShifted=this.isValid()&&0<a(e._a,t.toArray())}else this._isDSTShifted=!1;return this._isDSTShifted});var hn=P.prototype;function cn(e,t,n,s){var i=lt(),r=y().set(s,t);return i[n](r,e)}function fn(e,t,n){if(d(e)&&(t=e,e=void 0),e=e||"",null!=t)return cn(e,t,n,"month");var s,i=[];for(s=0;s<12;s++)i[s]=cn(e,s,n,"month");return i}function mn(e,t,n,s){"boolean"==typeof e?d(t)&&(n=t,t=void 0):(t=e,e=!1,d(n=t)&&(n=t,t=void 0)),t=t||"";var i,r=lt(),a=e?r._week.dow:0;if(null!=n)return cn(t,(n+a)%7,s,"day");var o=[];for(i=0;i<7;i++)o[i]=cn(t,(i+a)%7,s,"day");return o}hn.calendar=function(e,t,n){var s=this._calendar[e]||this._calendar.sameElse;return x(s)?s.call(t,n):s},hn.longDateFormat=function(e){var t=this._longDateFormat[e],n=this._longDateFormat[e.toUpperCase()];return t||!n?t:(this._longDateFormat[e]=n.replace(/MMMM|MM|DD|dddd/g,function(e){return e.slice(1)}),this._longDateFormat[e])},hn.invalidDate=function(){return this._invalidDate},hn.ordinal=function(e){return this._ordinal.replace("%d",e)},hn.preparse=dn,hn.postformat=dn,hn.relativeTime=function(e,t,n,s){var i=this._relativeTime[n];return x(i)?i(e,t,n,s):i.replace(/%d/i,e)},hn.pastFuture=function(e,t){var n=this._relativeTime[0<e?"future":"past"];return x(n)?n(t):n.replace(/%s/i,t)},hn.set=function(e){var t,n;for(n in e)x(t=e[n])?this[n]=t:this["_"+n]=t;this._config=e,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source)},hn.months=function(e,t){return e?o(this._months)?this._months[e.month()]:this._months[(this._months.isFormat||We).test(t)?"format":"standalone"][e.month()]:o(this._months)?this._months:this._months.standalone},hn.monthsShort=function(e,t){return e?o(this._monthsShort)?this._monthsShort[e.month()]:this._monthsShort[We.test(t)?"format":"standalone"][e.month()]:o(this._monthsShort)?this._monthsShort:this._monthsShort.standalone},hn.monthsParse=function(e,t,n){var s,i,r;if(this._monthsParseExact)return function(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],s=0;s<12;++s)r=y([2e3,s]),this._shortMonthsParse[s]=this.monthsShort(r,"").toLocaleLowerCase(),this._longMonthsParse[s]=this.months(r,"").toLocaleLowerCase();return n?"MMM"===t?-1!==(i=Ye.call(this._shortMonthsParse,a))?i:null:-1!==(i=Ye.call(this._longMonthsParse,a))?i:null:"MMM"===t?-1!==(i=Ye.call(this._shortMonthsParse,a))?i:-1!==(i=Ye.call(this._longMonthsParse,a))?i:null:-1!==(i=Ye.call(this._longMonthsParse,a))?i:-1!==(i=Ye.call(this._shortMonthsParse,a))?i:null}.call(this,e,t,n);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),s=0;s<12;s++){if(i=y([2e3,s]),n&&!this._longMonthsParse[s]&&(this._longMonthsParse[s]=new RegExp("^"+this.months(i,"").replace(".","")+"$","i"),this._shortMonthsParse[s]=new RegExp("^"+this.monthsShort(i,"").replace(".","")+"$","i")),n||this._monthsParse[s]||(r="^"+this.months(i,"")+"|^"+this.monthsShort(i,""),this._monthsParse[s]=new RegExp(r.replace(".",""),"i")),n&&"MMMM"===t&&this._longMonthsParse[s].test(e))return s;if(n&&"MMM"===t&&this._shortMonthsParse[s].test(e))return s;if(!n&&this._monthsParse[s].test(e))return s}},hn.monthsRegex=function(e){return this._monthsParseExact?(m(this,"_monthsRegex")||Ne.call(this),e?this._monthsStrictRegex:this._monthsRegex):(m(this,"_monthsRegex")||(this._monthsRegex=Ue),this._monthsStrictRegex&&e?this._monthsStrictRegex:this._monthsRegex)},hn.monthsShortRegex=function(e){return this._monthsParseExact?(m(this,"_monthsRegex")||Ne.call(this),e?this._monthsShortStrictRegex:this._monthsShortRegex):(m(this,"_monthsShortRegex")||(this._monthsShortRegex=Le),this._monthsShortStrictRegex&&e?this._monthsShortStrictRegex:this._monthsShortRegex)},hn.week=function(e){return Ie(e,this._week.dow,this._week.doy).week},hn.firstDayOfYear=function(){return this._week.doy},hn.firstDayOfWeek=function(){return this._week.dow},hn.weekdays=function(e,t){return e?o(this._weekdays)?this._weekdays[e.day()]:this._weekdays[this._weekdays.isFormat.test(t)?"format":"standalone"][e.day()]:o(this._weekdays)?this._weekdays:this._weekdays.standalone},hn.weekdaysMin=function(e){return e?this._weekdaysMin[e.day()]:this._weekdaysMin},hn.weekdaysShort=function(e){return e?this._weekdaysShort[e.day()]:this._weekdaysShort},hn.weekdaysParse=function(e,t,n){var s,i,r;if(this._weekdaysParseExact)return function(e,t,n){var s,i,r,a=e.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],s=0;s<7;++s)r=y([2e3,1]).day(s),this._minWeekdaysParse[s]=this.weekdaysMin(r,"").toLocaleLowerCase(),this._shortWeekdaysParse[s]=this.weekdaysShort(r,"").toLocaleLowerCase(),this._weekdaysParse[s]=this.weekdays(r,"").toLocaleLowerCase();return n?"dddd"===t?-1!==(i=Ye.call(this._weekdaysParse,a))?i:null:"ddd"===t?-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:null:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:null:"dddd"===t?-1!==(i=Ye.call(this._weekdaysParse,a))?i:-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:null:"ddd"===t?-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:-1!==(i=Ye.call(this._weekdaysParse,a))?i:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:null:-1!==(i=Ye.call(this._minWeekdaysParse,a))?i:-1!==(i=Ye.call(this._weekdaysParse,a))?i:-1!==(i=Ye.call(this._shortWeekdaysParse,a))?i:null}.call(this,e,t,n);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),s=0;s<7;s++){if(i=y([2e3,1]).day(s),n&&!this._fullWeekdaysParse[s]&&(this._fullWeekdaysParse[s]=new RegExp("^"+this.weekdays(i,"").replace(".","\\.?")+"$","i"),this._shortWeekdaysParse[s]=new RegExp("^"+this.weekdaysShort(i,"").replace(".","\\.?")+"$","i"),this._minWeekdaysParse[s]=new RegExp("^"+this.weekdaysMin(i,"").replace(".","\\.?")+"$","i")),this._weekdaysParse[s]||(r="^"+this.weekdays(i,"")+"|^"+this.weekdaysShort(i,"")+"|^"+this.weekdaysMin(i,""),this._weekdaysParse[s]=new RegExp(r.replace(".",""),"i")),n&&"dddd"===t&&this._fullWeekdaysParse[s].test(e))return s;if(n&&"ddd"===t&&this._shortWeekdaysParse[s].test(e))return s;if(n&&"dd"===t&&this._minWeekdaysParse[s].test(e))return s;if(!n&&this._weekdaysParse[s].test(e))return s}},hn.weekdaysRegex=function(e){return this._weekdaysParseExact?(m(this,"_weekdaysRegex")||Be.call(this),e?this._weekdaysStrictRegex:this._weekdaysRegex):(m(this,"_weekdaysRegex")||(this._weekdaysRegex=$e),this._weekdaysStrictRegex&&e?this._weekdaysStrictRegex:this._weekdaysRegex)},hn.weekdaysShortRegex=function(e){return this._weekdaysParseExact?(m(this,"_weekdaysRegex")||Be.call(this),e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(m(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=qe),this._weekdaysShortStrictRegex&&e?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)},hn.weekdaysMinRegex=function(e){return this._weekdaysParseExact?(m(this,"_weekdaysRegex")||Be.call(this),e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(m(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=Je),this._weekdaysMinStrictRegex&&e?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)},hn.isPM=function(e){return"p"===(e+"").toLowerCase().charAt(0)},hn.meridiem=function(e,t,n){return 11<e?n?"pm":"PM":n?"am":"AM"},ot("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(e){var t=e%10;return e+(1===k(e%100/10)?"th":1===t?"st":2===t?"nd":3===t?"rd":"th")}}),c.lang=n("customMoment.lang is deprecated. Use customMoment.locale instead.",ot),c.langData=n("customMoment.langData is deprecated. Use customMoment.localeData instead.",lt);var _n=Math.abs;function yn(e,t,n,s){var i=At(t,n);return e._milliseconds+=s*i._milliseconds,e._days+=s*i._days,e._months+=s*i._months,e._bubble()}function gn(e){return e<0?Math.floor(e):Math.ceil(e)}function pn(e){return 4800*e/146097}function vn(e){return 146097*e/4800}function wn(e){return function(){return this.as(e)}}var Mn=wn("ms"),Sn=wn("s"),Dn=wn("m"),kn=wn("h"),Yn=wn("d"),On=wn("w"),Tn=wn("M"),xn=wn("y");function bn(e){return function(){return this.isValid()?this._data[e]:NaN}}var Pn=bn("milliseconds"),Wn=bn("seconds"),Hn=bn("minutes"),Rn=bn("hours"),Cn=bn("days"),Fn=bn("months"),Ln=bn("years");var Un=Math.round,Nn={ss:44,s:45,m:45,h:22,d:26,M:11};var Gn=Math.abs;function Vn(e){return(0<e)-(e<0)||+e}function En(){if(!this.isValid())return this.localeData().invalidDate();var e,t,n=Gn(this._milliseconds)/1e3,s=Gn(this._days),i=Gn(this._months);t=D((e=D(n/60))/60),n%=60,e%=60;var r=D(i/12),a=i%=12,o=s,u=t,l=e,d=n?n.toFixed(3).replace(/\.?0+$/,""):"",h=this.asSeconds();if(!h)return"P0D";var c=h<0?"-":"",f=Vn(this._months)!==Vn(h)?"-":"",m=Vn(this._days)!==Vn(h)?"-":"",_=Vn(this._milliseconds)!==Vn(h)?"-":"";return c+"P"+(r?f+r+"Y":"")+(a?f+a+"M":"")+(o?m+o+"D":"")+(u||l||d?"T":"")+(u?_+u+"H":"")+(l?_+l+"M":"")+(d?_+d+"S":"")}var In=Ht.prototype;return In.isValid=function(){return this._isValid},In.abs=function(){var e=this._data;return this._milliseconds=_n(this._milliseconds),this._days=_n(this._days),this._months=_n(this._months),e.milliseconds=_n(e.milliseconds),e.seconds=_n(e.seconds),e.minutes=_n(e.minutes),e.hours=_n(e.hours),e.months=_n(e.months),e.years=_n(e.years),this},In.add=function(e,t){return yn(this,e,t,1)},In.subtract=function(e,t){return yn(this,e,t,-1)},In.as=function(e){if(!this.isValid())return NaN;var t,n,s=this._milliseconds;if("month"===(e=R(e))||"year"===e)return t=this._days+s/864e5,n=this._months+pn(t),"month"===e?n:n/12;switch(t=this._days+Math.round(vn(this._months)),e){case"week":return t/7+s/6048e5;case"day":return t+s/864e5;case"hour":return 24*t+s/36e5;case"minute":return 1440*t+s/6e4;case"second":return 86400*t+s/1e3;case"millisecond":return Math.floor(864e5*t)+s;default:throw new Error("Unknown unit "+e)}},In.asMilliseconds=Mn,In.asSeconds=Sn,In.asMinutes=Dn,In.asHours=kn,In.asDays=Yn,In.asWeeks=On,In.asMonths=Tn,In.asYears=xn,In.valueOf=function(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*k(this._months/12):NaN},In._bubble=function(){var e,t,n,s,i,r=this._milliseconds,a=this._days,o=this._months,u=this._data;return 0<=r&&0<=a&&0<=o||r<=0&&a<=0&&o<=0||(r+=864e5*gn(vn(o)+a),o=a=0),u.milliseconds=r%1e3,e=D(r/1e3),u.seconds=e%60,t=D(e/60),u.minutes=t%60,n=D(t/60),u.hours=n%24,o+=i=D(pn(a+=D(n/24))),a-=gn(vn(i)),s=D(o/12),o%=12,u.days=a,u.months=o,u.years=s,this},In.clone=function(){return At(this)},In.get=function(e){return e=R(e),this.isValid()?this[e+"s"]():NaN},In.milliseconds=Pn,In.seconds=Wn,In.minutes=Hn,In.hours=Rn,In.days=Cn,In.weeks=function(){return D(this.days()/7)},In.months=Fn,In.years=Ln,In.humanize=function(e){if(!this.isValid())return this.localeData().invalidDate();var t,n,s,i,r,a,o,u,l,d,h,c=this.localeData(),f=(n=!e,s=c,i=At(t=this).abs(),r=Un(i.as("s")),a=Un(i.as("m")),o=Un(i.as("h")),u=Un(i.as("d")),l=Un(i.as("M")),d=Un(i.as("y")),(h=r<=Nn.ss&&["s",r]||r<Nn.s&&["ss",r]||a<=1&&["m"]||a<Nn.m&&["mm",a]||o<=1&&["h"]||o<Nn.h&&["hh",o]||u<=1&&["d"]||u<Nn.d&&["dd",u]||l<=1&&["M"]||l<Nn.M&&["MM",l]||d<=1&&["y"]||["yy",d])[2]=n,h[3]=0<+t,h[4]=s,function(e,t,n,s,i){return i.relativeTime(t||1,!!n,e,s)}.apply(null,h));return e&&(f=c.pastFuture(+this,f)),c.postformat(f)},In.toISOString=En,In.toString=En,In.toJSON=En,In.locale=Qt,In.localeData=Kt,In.toIsoString=n("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",En),In.lang=Xt,I("X",0,0,"unix"),I("x",0,0,"valueOf"),ue("x",se),ue("X",/[+-]?\d+(\.\d{1,3})?/),ce("X",function(e,t,n){n._d=new Date(1e3*parseFloat(e,10))}),ce("x",function(e,t,n){n._d=new Date(k(e))}),c.version="2.22.2",e=Tt,c.fn=ln,c.min=function(){return Pt("isBefore",[].slice.call(arguments,0))},c.max=function(){return Pt("isAfter",[].slice.call(arguments,0))},c.now=function(){return Date.now?Date.now():+new Date},c.utc=y,c.unix=function(e){return Tt(1e3*e)},c.months=function(e,t){return fn(e,t,"months")},c.isDate=h,c.locale=ot,c.invalid=v,c.duration=At,c.isMoment=S,c.weekdays=function(e,t,n){return mn(e,t,n,"weekdays")},c.parseZone=function(){return Tt.apply(null,arguments).parseZone()},c.localeData=lt,c.isDuration=Rt,c.monthsShort=function(e,t){return fn(e,t,"monthsShort")},c.weekdaysMin=function(e,t,n){return mn(e,t,n,"weekdaysMin")},c.defineLocale=ut,c.updateLocale=function(e,t){if(null!=t){var n,s,i=nt;null!=(s=at(e))&&(i=s._config),(n=new P(t=b(i,t))).parentLocale=st[e],st[e]=n,ot(e)}else null!=st[e]&&(null!=st[e].parentLocale?st[e]=st[e].parentLocale:null!=st[e]&&delete st[e]);return st[e]},c.locales=function(){return s(st)},c.weekdaysShort=function(e,t,n){return mn(e,t,n,"weekdaysShort")},c.normalizeUnits=R,c.relativeTimeRounding=function(e){return void 0===e?Un:"function"==typeof e&&(Un=e,!0)},c.relativeTimeThreshold=function(e,t){return void 0!==Nn[e]&&(void 0===t?Nn[e]:(Nn[e]=t,"s"===e&&(Nn.ss=t-1),!0))},c.calendarFormat=function(e,t){var n=e.diff(t,"days",!0);return n<-6?"sameElse":n<-1?"lastWeek":n<0?"lastDay":n<1?"sameDay":n<2?"nextDay":n<7?"nextWeek":"sameElse"},c.prototype=ln,c.HTML5_FMT={DATETIME_LOCAL:"YYYY-MM-DDTHH:mm",DATETIME_LOCAL_SECONDS:"YYYY-MM-DDTHH:mm:ss",DATETIME_LOCAL_MS:"YYYY-MM-DDTHH:mm:ss.SSS",DATE:"YYYY-MM-DD",TIME:"HH:mm",TIME_SECONDS:"HH:mm:ss",TIME_MS:"HH:mm:ss.SSS",WEEK:"YYYY-[W]WW",MONTH:"YYYY-MM"},c});

if (typeof module !== "undefined" && module.exports) module.exports = Note;
nodeunit = typeof nodeunit === 'undefined' ? require('nodeunit') : nodeunit;
Influence = typeof Influence === 'undefined' ? require('..') : Influence;


(async function() {
  var scripts = await document.getElementsByTagName('script');
  var myScript;
  for(let i = 0; i < scripts.length; i++) {
    if(scripts[i].src.split('?')[0] == 'https://storage.googleapis.com/influence-197607.appspot.com/influence-analytics.js')
    // if(scripts[i].src.split('?')[0] == 'http://localhost:3000/test/influence-analytics.js')
      myScript = scripts[i];
  }

  var queryString = myScript?myScript.src.replace(/^[^\?]+\??/,''):'';

  function parseQuery ( query ) {
     var Params = new Object ();
     if ( ! query ) return Params; // return empty object
     var Pairs = query.split(/[;&]/);
     for ( var i = 0; i < Pairs.length; i++ ) {
        var KeyVal = Pairs[i].split('=');
        if ( ! KeyVal || KeyVal.length != 2 ) continue;
        var key = unescape( KeyVal[0] );
        var val = unescape( KeyVal[1] );
        val = val.replace(/\+/g, ' ');
        Params[key] = val;
     }
     return Params;
  }

  var params = parseQuery(queryString);
  if(params.trackingId) {
    new Influence({
      trackingId: params.trackingId
    });
  }

})();
