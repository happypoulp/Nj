// Test Module

/*

IMPORTANT NOTES ABOUT THE PROPAGATION BEHAVIOR :

All events have a default propagation behaviour : they DO propagate to ancestor of the element concerned by the event.

It means that once an event is fired on an element, we will try to handle it :

 - if a handler for this event is found on this element then the propagation value will change regarding what the handler returns.

    - if the handler returns nothing (=undefined) or true :
        the propagation WILL occur.

    - if the handler returns false :
        the propagation WILL NOT occur.

    - if the handler return {callId: id} (meaning if we are doing an ajax call via Nj.Ajax and returning it when leaving the handler) :
        The propagation WILL occur after the callback of the ajax call, no matter of the synchronousity / asynchronousity of the callback

    - if the handler return {redirect:, href:} :
        no propagation can occur. The redirect will happen, preventing from any propagation to be done.

 - if no handler are found for this event on this element then, accordingly to the propagation default value it will go up on ancestors of this 
 element.

Want to ...

--------  ...do a SYNCHRONOUS action and NOT PROPAGATE ? -----------

handler: function(handlerDatas)
{
    // Do smthg synchronous

    return false;
}

--------  ...do a SYNCHRONOUS action and PROPAGATE (by default) ? -----------

handler: function(handlerDatas)
{
    // Do smthg synchronous

    return true; // optionnal
}

--------  ...do a SYNCHRONOUS action and then a REDIRECT ? -----------

handler: function(handlerDatas)
{
    // Do smthg synchronous

    return {redirect: '?redirected'};
}

--------  ...do a SYNCHRONOUS action and PROPAGATE and then a REDIRECT ? -----------

YOU CANNOT. REDIRECT and PROPAGATE are contrary decisions. you can propably do what you want differently.

--------  ...do an ASYNCHRONOUS action via Nj.Ajax ? -----------

handler: function(handlerDatas)
{
    return Nj.Ajax.call({
        method: 'get', // or 'post'
        href: <ajax_href>,
        callback: {module: <module_name>, method: <method_name>}
    });
}

*/

(function() {
    return {
        name: 'Test',
        handlers:
        {
            click:
            {
                done: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done click# </span>');
                },
                done_no_prop: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done_no_prop click# </span>');
                    return false;
                },
                done_and_redirect: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done_and_redirect click# </span>');
                    return {redirect: '?redirected'};
                }
            },
            mousedown:
            {
                done: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done mousedown# </span>');
                },
                done_no_prop: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done_no_prop mousedown# </span>');
                    return false;
                },
                done_and_redirect: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done_and_redirect mousedown# </span>');
                    return {redirect: '?redirected'};
                }
            },
            mouseup:
            {
                done: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done mouseup# </span>');
                },
                done_no_prop: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done_no_prop mouseup# </span>');
                    return false;
                },
                done_and_redirect: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done_and_redirect mouseup# </span>');
                    return {redirect: '?redirected'};
                }
            },
            keyup:
            {
                catch: function(handlerDatas)
                {
                    if (handlerDatas.element.nodeName.toUpperCase() == 'INPUT')
                    {
                        $(handlerDatas.element).after('<span class="green">#catch input keyup# </span>');
                    }
                    else
                    {
                        $(handlerDatas.element).append('<span class="green">#catch element keyup# </span>');
                    }
                },
                catch_no_prop: function(handlerDatas)
                {
                    if (handlerDatas.element.nodeName.toUpperCase() == 'INPUT')
                    {
                        $(handlerDatas.element).after('<span class="green">#catch input keyup# </span>');
                    }
                    else
                    {
                        $(handlerDatas.element).append('<span class="green">#catch element keyup# </span>');
                    }

                    return false;
                },
                input_key: function(handlerDatas)
                {
                    clearTimeout(this.inputTO);

                    this.inputTO = setTimeout($.proxy(function()
                    {
                        this.inputAjaxCallId = Nj.Ajax.call({
                            method: 'get',
                            href: '/test/ajaxtestinput',
                            callback: {module: 'Test', method: 'inputCallback'},
                            handlerDatas: handlerDatas
                        }).ajax_call_id;
                    }, this), 400);

                    return false;
                }
            },
            mouseover:
            {
                done: function(handlerDatas)
                {
                    // log(handlerDatas.event.target, handlerDatas.element);
                    $(handlerDatas.element).append('<span class="green">#done mouseover# </span>');
                }
            },
            mouseout:
            {
                done: function(handlerDatas)
                {
                    $(handlerDatas.element).append('<span class="green">#done mouseout# </span>');
                }
            }
        },
        inputCallback: function(html, xdatas)
        {
            // To be sure that we handle the callback for real last ajax call being done
            if (xdatas.callId === this.inputAjaxCallId)
            {
                var el = $(xdatas.handlerDatas.element),
                    parent = el.parent();

                if (parent.children('div.form_error').length)
                {
                    parent.children('div.form_error').remove();
                }
                el.after(html);
            }
        },
        insertResult: function(html, xdatas)
        {
            $('#ajax_result').append(html);
            alert('ajax callback successfully called');
        },
        init: function()
        {
            Nj.Modules.register(this);
        }
    }.init();
})();