/***********************************
**  Our Ninja Javascript - AKA "Nj"
***********************************/
(function(window, undefined){
    var document = window.document,
        Nj = {
            Utils: // Utils holds possibly useful functions
            {
                log: function()
                {
                    args = [new Date().toLocaleTimeString()].concat(Array.prototype.slice.call(arguments))
                    try
                    {
                        console.log.apply(console, args);
                    }
                    catch(e)
                    {
                        try
                        {
                            opera.postError.apply(opera, args);
                        }
                        catch(e)
                        {
                            alert(Array.prototype.join.call( args, " " ));
                        }
                    }
                },
                unique: (function()
                {
                    var u = function()
                    {
                        return arguments.callee.counter++;
                    };
                    u.counter = 0;
                    return u;
                })(),
                $: function(id)
                {
                    return document.getElementById(id);
                },
                inspect: function(obj)
                {
                    var o = '';
                    for (var i in obj)
                    {
                        o += ' '+i + ':'+obj[i];
                    }
                    return '{' + o + ' }';
                },
                capitalize: function(str)
                {
                    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
                },
                identify: function(jElt)
                {
                    var id = jElt.attr('id');
                    if (!id)
                    {
                        do
                        {
                            id = 'nj_uid_' + this.unique();
                        } while ($('#'+id).length);
                        jElt.attr('id', id);
                    }
                    return id;
                }
            },
            Event: // Event handles Event Delegation ...
            {
                lastHandlerCalledList: {},
                register_no_data_elements: false,
                // Start Event Delegation
                init: function()
                {
                    this.registry = {};

                    // ... via "document click"
                    // $.proxy is done to overload jQuery callback binding on document element
                    $(document)
                    .click($.proxy(function(e)
                    {
                        // log('############## document click initiated from : ', e.target);
                         Nj.Event.register_no_data_elements = false;
                        this.eventHandler(e, null, 'click');
                    }, this))
                    // ... via "document mousedown"
                    // $.proxy is done to overload jQuery callback binding on document element
                    .mousedown($.proxy(function(e)
                    {
                        // log('############## document mousedown initiated from : ', e.target);
                        if ((e.button && e.button != 2) || (e.which && e.which != 3)) // To avoid catching right clicks
                        {
                            // log('document mousedown initiated from : ', e.target);
                            Nj.Event.register_no_data_elements = false;
                            this.eventHandler(e, null, 'mousedown');
                        }
                    }, this))
                    // ... via "document mouseup"
                    .mouseup($.proxy(function(e)
                    {
                        // log('############## document mouseup initiated from : ', e.target);
                        if (!this.handleSpecialMouseDownUp(e, 'mouseup'))
                        {
                            // log('mouseup not specialy handled, do it default way');
                            Nj.Event.register_no_data_elements = false;
                            this.eventHandler(e, null, 'mouseup');
                        }
                    }, this))

                    // ... via "document submit"
                    .submit($.proxy(function(e)
                    {
                        // log('############## document submit initiated from : ', e.target);
                        Nj.Event.register_no_data_elements = false;
                        this.eventHandler(e, null, 'submit');
                    }, this))

                    // ... via "document key up" (keypress does not catch DEL and some others keys)
                    .keyup($.proxy(function(e)
                    {
                        // log('############## document keyup initiated from : ', e.target);
                        Nj.Event.register_no_data_elements = false;
                        this.eventHandler(e, null, 'keyup');
                    }, this))

                    // ... via "document mouseover"
                    .mouseover($.proxy(function(e)
                    {
                        // log('############## document MOUSEOVER recieved from : ', e.target);
                        this.mouseoveredElement = e.target;
                        this.mouseoverTimeout && clearTimeout(this.mouseoverTimeout);
                        this.mouseoverTimeout = setTimeout(function()
                        {
                            // log('## document MOUSEOVER TIMEOUT reached for : ', e.target);
                            Nj.Event.register_no_data_elements = true;
                            Nj.Event.eventHandler(e, null, 'mouseover');
                        }, 75);
                    }, this))
                    // ... via "document mouseout"
                    .mouseout($.proxy(function(e)
                    {
                        // log('############## document MOUSEOUT recieved from : ', e.target);
                        this.mouseoutedElement = e.target;
                        this.mouseoutTimeout && clearTimeout(this.mouseoutTimeout);
                        this.mouseoutTimeout = setTimeout(function()
                        {
                            // log('## document MOUSEOUT TIMEOUT reached for : ', e.target);
                            Nj.Event.register_no_data_elements = false;
                            Nj.Event.eventHandler(e, null, 'mouseout');
                        }, 75);
                    }, this))
                    // ... via "document focusin"
                    .bind('focusin', $.proxy(function(e)
                    {
                        // log('############## document FOCUSIN recieved from : ', e.target);
                        Nj.Event.register_no_data_elements = false;
                        Nj.Event.eventHandler(e, null, 'focusin');
                    }, this))
                    // ... via "document focusout"
                    .bind('focusout', $.proxy(function(e)
                    {
                        // log('############## document FOCUSOUT recieved from : ', e.target);
                        Nj.Event.register_no_data_elements = false;
                        Nj.Event.eventHandler(e, null, 'focusout');
                    }, this));
                },
                // Register new handlers for given module
                registerHandlersForModule: function(module)
                {
                    for (type in module.handlers)
                    {
                        for (element in module.handlers[type])
                        {
                            this.register(type, module.name + '.' + element, module.handlers[type][element], module)
                        }
                    }
                },
                // Register new handler for an element
                register: function(type, elementKey, handler, context)
                {
                    var typeRegister = this.registry[type];

                    if (!typeRegister)
                    {
                        typeRegister = this.registry[type] = {};
                    }

                    if (context)
                    {
                        // $.proxy is used to ensure that handler will be run inside module context.
                        typeRegister[elementKey] = $.proxy(handler, context);
                    }
                    else
                    {
                        typeRegister[elementKey] = handler;
                    }
                },
                rememberElementForEvent: function(eventName, jElt)
                {
                    // log('rememberElementForEvent', eventName, jElt);
                    if (eventName == 'mousedown' && jElt.data('mousedown') && jElt.data('mouseup') && jElt.attr('data-followmouseup') == '' && !this.mouseDownEltId)
                    {
                        this.mouseDownEltId = Nj.Utils.identify(jElt);
                        // log('Registered for mousedown', this.mouseDownEltId);
                    }
                },
                handleSpecialMouseDownUp: function(ev, eventName)
                {
                    var jElt = $(ev.target);

                    // log('handleSpecialMouseDownUp', this.mouseDownEltId);
                    if (eventName == 'mouseup' && this.mouseDownEltId)
                    {
                        if (Nj.Utils.identify(jElt) != this.mouseDownEltId)
                        {
                            // log('Found a special handler for', this.mouseDownEltId);
                            var elt = Nj.Utils.$(this.mouseDownEltId);
                            this.mouseDownEltId = null;
                            this.eventHandler(ev, elt, 'mouseup');
                            return true;
                        }
                    }

                    this.mouseDownEltId = null;
                },
                abortHandling: function(eventName, elt)
                {
                    // log('[abortHandling]');
                    if (eventName == 'mouseover')
                    {
                        // log('abort mouseover?');
                        // log('Last mouseouted element', this.mouseoutedElement);
                        // log('Abort if there is this.mouseoutedElement and it is ', elt, 'or one of its child : ', $(elt).find(this.mouseoutedElement).length);
                        // log('AND');
                        // log('if this.lastHandlerCalledList.mouseover', this.lastHandlerCalledList.mouseover, 'and eltId "',elt.id, '" is in it');
                        if (
                            this.mouseoutedElement &&
                            (elt == this.mouseoutedElement || $(elt).find(this.mouseoutedElement).length) &&
                            this.lastHandlerCalledList.mouseover &&
                            elt.id &&
                            this.lastHandlerCalledList.mouseover[elt.id]
                        )
                        {
                            return true;
                        }
                    }
                    if (eventName == 'mouseout')
                    {
                        // log('abort mouseout?');
                        // log('Last mouseovered element element', this.mouseoveredElement);
                        // log('Abort if there is this.mouseoveredElement and it is ', elt, 'or one of its child : ', $(elt).find(this.mouseoveredElement).length);
                        if (
                            this.mouseoveredElement &&
                            (elt == this.mouseoveredElement || $(elt).find(this.mouseoveredElement).length)
                        )
                        {
                            return true;
                        }
                    }

                    return false;
                },
                lastHandlerCalled: function(eventName, eltId)
                {
                    var events = ['mouseout', 'mouseover'];

                    if (events.indexOf(eventName) != -1)
                    {
                        var oppositeHandlerCalledList = this.lastHandlerCalledList[events[1 - events.indexOf(eventName)]];

                        if (!this.lastHandlerCalledList[eventName])
                        {
                            this.lastHandlerCalledList[eventName] = {};
                        }
                        this.lastHandlerCalledList[eventName][eltId] = 1;
                        oppositeHandlerCalledList && delete(oppositeHandlerCalledList[eltId]);
                    }
                },
                propagationEnded: function(ev, eventName)
                {
                    // log('[propagationEnded]', ev, eventName);
                    if (eventName == 'mouseout' && ev && this.lastHandlerCalledList.mouseover)
                    {
                        // log('Handle propagation ended for mouseout');
                        var target = ev.target,
                            targetId = Nj.Utils.identify($(target)),
                            elementsToMouseout = this.lastHandlerCalledList.mouseover;

                        // log('Original event for mouseout :', ev.target);
                        // log('iterate on', Nj.Utils.inspect(elementsToMouseout), 'to call mouseout if needed.')

                        // Unregister lastHandlerCalledList.mouseover
                        for (var id in elementsToMouseout)
                        {
                            // log('$(#'+targetId+').closest(#'+id+').length=', $('#' + targetId).closest('#' + id).length);

                            if ($('#' + targetId).closest('#' + id).length)
                            {
                                // log(id, 'is an ancestor (or himself) of', targetId);
                                // log('this.mouseoveredElement', this.mouseoveredElement);

                                if (targetId == id)
                                {
                                    // log('targetId == id');
                                    if (!$('#' + id).find(this.mouseoveredElement).length)
                                    {
                                        // log('Call eventHandler for mouseout on elt with id ', id);
                                        Nj.Event.eventHandler(ev, Nj.Utils.$(id), 'mouseout', false);
                                    }
                                }
                            }
                            else
                            {
                                // log(id + ' is a child or a neighbour of ' + targetId);
                                // log('this.mouseoveredElement', this.mouseoveredElement);
                                // log('this.mouseoutedElement', this.mouseoutedElement);
                                // log('Call eventHandler for mouseout on elt with id ', id);
                                Nj.Event.eventHandler(ev, Nj.Utils.$(id), 'mouseout', false);
                            }
                        }
                    }
                },
                removeCalledHandler: function(eventName, elt)
                {
                    eventName = eventName == 'mouseout' ? 'mouseover' : eventName;
                    // log('[removeCalledHandler]', eventName, elt);
                    // log('this.lastHandlerCalledList[' + eventName + ']', Nj.Utils.inspect(this.lastHandlerCalledList[eventName]));
                    if (this.lastHandlerCalledList[eventName] && elt && elt.id)
                    {
                        // log('^^^^ DO REMOVE', elt.id, 'from', Nj.Utils.inspect(this.lastHandlerCalledList[eventName]));
                        delete(this.lastHandlerCalledList[eventName][elt.id]);
                    }
                },
                eventHandler: function(ev, elt, eventName, force_propagate)
                {
                    // log('[eventHandler]', ev, elt, eventName, force_propagate);

                    var elt = elt || (ev ? ev.target : null),
                        jElt = $(elt),
                        propagate = force_propagate === undefined ? true : force_propagate,
                        data = jElt.data(eventName);
                        // log('Search for data-' + eventName + ' in ', jElt);

                    // log('this.register_no_data_elements', this.register_no_data_elements);

                    if (data && /\./.test(data))
                    {
                        // log('Found data', eventName);

                        var parts = data.split('.'),
                            jsonData = {module: parts[0], name: parts[1]}; // log('Datas found in this element : ', jsonData);

                        // By default we assume that we want to prevent default behavior to occur
                        ev && ev.preventDefault();

                        if (this.abortHandling(eventName, elt))
                        {
                            // log('**** Abort', eventName, 'on', jElt);
                            return;
                        }

                        // Handle module dependant handler
                        if (jsonData.module && !Nj.Modules.loaded(jsonData.module))
                        {
                            // log('Need loading of module', jsonData.module);
                            // Load required module and assign callback
                            Nj.Modules.loadForEventOnElement(eventName, elt, function()
                            {
                                // log(jsonData.module, 'Module loaded relaunch handler');
                                Nj.Event.eventHandler(ev, elt, eventName);
                            });
                            return;
                        }


                        // Remember which element was event-ised (store its id in the appropriate handler)
                        this.rememberElementForEvent(eventName, jElt);

                        var handlerName = data;
                        // Search for handler associated to jsonData.name in registry
                        if (this.registry[eventName][handlerName])
                        {
                            // log('Handler found for this event on this element');
                            // log('### Run handler ###');

                            var handlerReturn = this.registry[eventName][handlerName]({event: ev, element: elt, elDatas: jsonData}),
                                handlerPropagate = false;

                            this.register_no_data_elements = false;

                            this.lastHandlerCalled(eventName, Nj.Utils.identify(jElt));

                            if (handlerReturn && handlerReturn.redirect)
                            {
                                var redirectHref = handlerReturn.redirect || elt.href;
                                if (redirectHref)
                                {
                                    return document.location = redirectHref;
                                }
                            }

                            if (handlerReturn === undefined || handlerReturn === true)
                            {
                                handlerPropagate = true;
                            }
                            else if (handlerReturn && handlerReturn.ajax_call_id)
                            {
                                // log('Handler return an ajax call');
                                var args = arguments;
                                Nj.Ajax._addDoneCallback(handlerReturn.ajax_call_id, $.proxy(function ()
                                {
                                    this.propagateEventFromElement.apply(this, args);
                                }, this));
                            }

                            propagate = propagate && handlerPropagate;
                        }
                    }
                    else if(this.register_no_data_elements)
                    {
                        // log('Add', Nj.Utils.identify(jElt), 'to list of handler called for', eventName);
                        this.lastHandlerCalled(eventName, Nj.Utils.identify(jElt));
                    }

                    if (force_propagate === false)
                    {
                        this.removeCalledHandler(eventName, elt);
                    }

                    this.propagateEventFromElement(ev, elt, eventName, propagate);
                },
                propagateEventFromElement: function(ev, elt, eventName, propagate)
                {
                    // log('[propagateEventFromElement]', ev, elt, eventName, propagate);
                    // elt.nodeType == 1 is to check that we do not go beyond "html" tag
                    if (propagate && (elt = elt.parentNode) && elt.nodeType == 1)
                    {
                        // log('Event', eventName, 'Element found for propagation : ', $(elt));
                        return this.eventHandler(ev, elt, eventName);
                    }

                    // log('Call propagation ended for', eventName);
                    this.propagationEnded(ev, eventName);

                    // log('------------------ END OF PROPAGATION "', eventName, '" ----------------');
                }
            },
            // Modules handles the logic for loading and managing all JS modules of the page.
            // These modules have to fulfill a specific structure to allow Modules manager 
            // to initialize them correctly.
            // Modules should be name like this : Module_With_A_Name, while the js loading it should be named like this : module_with_a_name.js
            Modules:
            {
                all: {},
                loading: {},
                // Basic load of a js module file
                load: function(name, callback)
                {
                    // log('loading module ', name, '...');
                    $.getScript(
                        Nj.Envs.get('modulesBaseURI') + name.toLowerCase() + '.js',
                        $.proxy(function()
                        {
                            if (!this.all[name]) {log('ERROR : Wrongly named module ', name, ' OR js file is broken.'); return;}
                            (callback || function(){})(this.all[name]);
                        }, this)
                    );
                },
                // Controlled load of a js module file (used in event handling)
                loadForEventOnElement: function(eventName, element, callback)
                {
                    var jElt = $(element),
                        jEltId = Nj.Utils.identify(jElt),
                        data = jElt.data(eventName),
                        parts = data.split('.'),
                        jsonData = {module: parts[0],name: parts[1]},
                        loadKey = jEltId + '_' + eventName + '_' + parts[1];

                    if (!this.loading[jsonData.module])
                    {
                        this.loading[jsonData.module] = {};
                        this.loading[jsonData.module][loadKey] = callback;

                        // log('loading module ', jsonData.module, '...');
                        $.getScript(
                            Nj.Envs.get('modulesBaseURI') + jsonData.module.toLowerCase() + '.js',
                            $.proxy(function()
                            {
                                if (!this.all[jsonData.module]) {log('Wrongly named module ', jsonData.module); return;}

                                // foreach callback, then launch it then remove it
                                for (prop in this.loading[jsonData.module])
                                {
                                    if (this.loading[jsonData.module].hasOwnProperty(prop))
                                    {
                                        this.loading[jsonData.module][prop](this.all[jsonData.module]);
                                        delete(this.loading[jsonData.module][prop]);
                                    }
                                }

                                // then delete all callbacks for this module loading
                                delete(this.loading[jsonData.module]);
                            }, this)
                        );
                    }
                    else
                    {
                        // This will either :
                        // - replace the existing callback by the new one
                        // or
                        // - add the new callback
                        this.loading[jsonData.module][loadKey] = callback;
                    }
                },
                loaded: function(name)
                {
                    return !!this.all[name];
                },
                get: function(name)
                {
                    return this.all[name];
                },
                register: function(module)
                {
                    if (!this.all[name])
                    {
                        this.all[module.name] = module;

                        // Register handlers to Nj.Event
                        Nj.Event.registerHandlersForModule(this.all[module.name]);
                    }

                    if (this.all[module.name].CLASS)
                    {
                        for(var c in this.all[module.name].CLASS)
                        {
                            if (this.all[module.name].CLASS.hasOwnProperty(c))
                            {
                                Nj.CLASS[c] = this.all[module.name].CLASS[c];
                            }
                        }
                    }
                },
                runOnModule: function(name, callback_name)
                {
                    var callbackArgs = Array.prototype.slice.call(arguments).slice(2);
                    this.run(name, function(module) {
                        module[callback_name].apply(module, callbackArgs);
                    });
                },
                run: function(name, callback)
                {
                    if (!this.all[name])
                    {
                        this.load(name, callback);
                    }
                    else
                    {
                        callback(this.all[name]);
                    }
                },
                addVariable: function(name, variableName, variableValue)
                {
                    // Check if module is already loaded...
                    if (this.all[name])
                    {
                        // ... then do the variable assignment.
                        this.all[name][variableName] = variableValue;
                        return;
                    }

                    // ... if not, load it ...
                    this.load(name, function()
                    {
                        // ... then do the variable assignment.
                        this.all[name][variableName] = variableValue;
                    });
                }
            },
            CLASS: {},
            Ajax:
            {
                call: function(datas)
                {
                    var callId = {};

                    if (!datas || !datas.confirmMsg || confirm(datas.confirmMsg))
                    {
                        var el = $(datas.elt).get(0),
                            callTarget = datas.href || el.href || null,
                            callParameters = datas.params || {},
                            ajaxMethod = $[datas['method'] || 'post'];

                        if (callTarget)
                        {
                            callId = {ajax_call_id: Nj.Utils.unique()};

                            ajaxMethod(
                                callTarget,
                                callParameters,
                                function(result)
                                {
                                    result = Nj.DEBUG ?
                                        $.parseJSON(result) : // Use this in text mode to debug malformed JSON result
                                        result;

                                    if (result && result.success && datas.callback)
                                    {
                                        if (typeof datas.callback.module == 'string')
                                        {
                                            Nj.Modules.run(datas.callback.module, function(module)
                                            {
                                                datas.callId = callId.ajax_call_id;
                                                module[datas.callback.method].call(module, result.html, datas);
                                            });
                                        }
                                        else if (typeof datas.callback.module == 'object')
                                        {
                                            datas.callId = callId.ajax_call_id;
                                            datas.callback.module[datas.callback.method].call(datas.callback.module, result, datas);
                                        }

                                        Nj.Ajax._done(callId.ajax_call_id);
                                    }
                                }, Nj.DEBUG ? 'text' : 'json' // Use text mode to debug malformed JSON result
                            );
                        }
                    }

                    return callId;
                },
                form: function(datas)
                {
                    var jForm = $(datas.elt),
                        ajaxMethod = $[jForm.attr('method') || 'get'],
                        callId = {id: Nj.Utils.unique()};

                    // Do the form ajax POST
                    ajaxMethod(
                        jForm.attr('action'),
                        jForm.serialize(),
                        function(result)
                        {
                            if (result)
                            {
                                // Form has errors
                                if (!result.success)
                                {
                                    // Replace Form
                                    jForm.replaceWith(result.html);
                                }
                                // Form POST succeed
                                else
                                {
                                    if (datas)
                                    {
                                        // Reset Form
                                        if (datas.reset)
                                        {
                                            jForm.get(0).reset();
                                        }

                                        // Search for a success callback and call it
                                        if (datas.callback)
                                        {
                                            Nj.Modules.run(datas.callback.module, function(module)
                                            {
                                                datas.callId = callId.id;

                                                module[datas.callback.method].call(module, result.html, datas);
                                            });
                                        }
                                    }
                                }
                            }
                        }, 'json'
                    );

                    return callId;
                },
                _addDoneCallback: function(ajax_call_id, doneCallback)
                {
                    this.doneCallbacks[ajax_call_id] = doneCallback;
                },
                _done: function(callId)
                {
                    if (this.doneCallbacks[callId])
                    {
                        this.doneCallbacks[callId]();
                        this.doneCallbacks[callId] = null;
                    }
                },
                doneCallbacks: {}
            },
            init: function()
            {
                if (window.Nj)
                {
                    for (prop in window.Nj)
                    {
                        if (window.Nj.hasOwnProperty(prop))
                        {
                            Nj[prop] = window.Nj[prop];
                        }
                    }
                    delete window.Nj;
                }

                Nj.initialized = true;
                // Start real Event Delegation Handler
                Nj.Event.init();
            }
        };

        // Expose "Nj.Utils.log" function to the global object for simpler use
        window.log = Nj.Utils.log;
        // Launch Nj initialisation
        Nj.init();
        // Expose Nj to the global object
        window.Nj = Nj;
        // Stop default document handling
        Nj.Preload.end();
})(window);