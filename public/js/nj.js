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
                    try
                    {
                        console.log.apply(console, arguments);
                    }
                    catch(e)
                    {
                        try
                        {
                            opera.postError.apply(opera, arguments);
                        }
                        catch(e)
                        {
                            alert(Array.prototype.join.call( arguments, " " ));
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
                // Start Event Delegation
                init: function()
                {
                    this.registry = {};

                    // ... via "document click"
                    // $.proxy is done to overload jQuery callback binding on document element
                    $(document)
                    .click($.proxy(function(e)
                    {
                        // log('document click initiated from : ', e.target);
                        this.eventHandler(e, null, 'click');
                    }, this))
                    // ... via "document mousedown"
                    // $.proxy is done to overload jQuery callback binding on document element
                    .mousedown($.proxy(function(e)
                    {
                        if ((e.button && e.button != 2) || (e.which && e.which != 3)) // To avoid catching right clicks
                        {
                            // log('document mousedown initiated from : ', e.target);
                            this.eventHandler(e, null, 'mousedown');
                        }
                    }, this))
                    // ... via "document mouseup"
                    .mouseup($.proxy(function(e)
                    {
                        // log('document mouseup initiated from : ', e.target);
                        this.eventHandler(e, null, 'mouseup');
                    }, this))

                    // ... via "document submit"
                    .submit($.proxy(function(e)
                    {
                        // log('document submit initiated from : ', e.target);
                        this.eventHandler(e, null, 'submit');
                    }, this))

                    // ... via "document key up" (keypress does not catch DEL and some others keys)
                    .keyup($.proxy(function(e)
                    {
                        // log('document keyup initiated from : ', e.target);
                        this.eventHandler(e, null, 'keyup');
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
                getSpecialTargetForEvent: function(eventName)
                {
                    return eventName == 'mouseup' && this['mousedownHandler'] && this['mousedownHandler'].target ?
                        $('#' + this['mousedownHandler'].target) :
                        null;
                },
                setTargetForEvent: function(eventName, targetId)
                {
                    this[eventName + 'Handler'] = {target: targetId};
                },
                cleanTargetForEvent: function(eventName)
                {
                    if (eventName == 'mouseup')
                    {
                        this['mouseupHandler'] = this['mousedownHandler'] = null;
                    }
                    else if (eventName != 'mousedown')
                    {
                        this[eventName + 'Handler'] = null;
                    }
                },
                eventHandler: function(ev, elt, eventName)
                {
                    var elt = this.getSpecialTargetForEvent(eventName) || elt || ev.target,
                        jElt = $(elt),
                        propagate = true,
                        data = jElt.data(eventName);
                        // log('Search for data-' + eventName + ' in ', jElt);

                    if (data && /\./.test(data))
                    {
                        // Remember which element was event-ised (store its id in the appropriate handler)
                        this.setTargetForEvent(eventName, Nj.Utils.identify(jElt));
                        // log('Remember target ', this[eventName + 'Handler'], 'for event', eventName);

                        var parts = data.split('.'),
                            jsonData = {module: parts[0], name: parts[1]}; // log('Datas found in this element : ', jsonData);

                        // By default we assume that we want to prevent default behavior to occur
                        ev.preventDefault();

                        // Handle module dependant handler
                        if (jsonData.module && !Nj.Modules.loaded(jsonData.module))
                        {
                            // log('Need loading of module', jsonData.module);
                            // Load required module and assign callback
                            Nj.Modules.loadForEventOnElement(eventName, elt, function()
                            {
                                Nj.Event.eventHandler(ev, elt, eventName);
                            });
                            return;
                        }

                        var handlerName = data;
                        // Search for handler associated to jsonData.name in registry
                        if (this.registry[eventName][handlerName])
                        {
                            // log('Handler found for this event on this element');
                            // Run handler
                            // log('### Run handler ###');
                            var handlerReturn = this.registry[eventName][handlerName]({event: ev, element: elt, elDatas: jsonData}),
                                handlerPropagate = false;

                            this.cleanTargetForEvent(eventName);

                            if (handlerReturn && handlerReturn.redirect)
                            {
                                var redirectHref = handlerReturn.href || elt.href;

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

                    if (propagate)
                    {
                        // log('Propagate event', eventName);
                        this.propagateEventFromElement(ev, elt, eventName);
                    }
                },
                propagateEventFromElement: function(ev, elt, eventName)
                {
                    // elt.nodeType == 1 is to check that we do not go beyond "html" tag
                    if ((elt = elt.parentNode) && elt.nodeType == 1)
                    {
                        this.eventHandler(ev, elt, eventName);
                    }
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
                    var jForm = $(datas['elt']),
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