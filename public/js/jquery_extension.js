/***********************************
**  Our jQuery Extensions
***********************************/
(function(){
    var jQueryExtensions =
    {
        getClassParam: function(param)
        {
            try
            {
                var regex = new RegExp(param + "_([A-Za-z0-9/:?&._-]+)"),
                    match = regex.exec(this.get(0).className);

                if(match)
                {
                    return match[1];
                }
            }
            catch(e){}

            return false;
        }
    };

    jQuery.fn.extend(jQueryExtensions);
})();
