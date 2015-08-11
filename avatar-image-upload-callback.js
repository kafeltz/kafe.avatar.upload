;(function ( $, window, document, undefined ) {

    "use strict";

    var pluginName = "imageUploader",
        defaults = {
            debug: false,
            retry_fetch_interval: 2000,
            MAX_FILE_SIZE: 2 * 1024 * 1024,
            FILE_TYPES: ["image/png", "image/gif", "image/jpeg"],
            ajax_settings: {
                url: "",
                url_retry: "",
                method: "POST"
            },
            callbacks: {
                success: undefined,
                sending: undefined,
                pending: undefined,
                fail:    undefined,
            }
        };

    // shorcuts/aliases
    var log  = function() {};
    var warn = function() {};

    var FAIL_MAX_FILE_SIZE_EXCEEDED = "FAIL_MAX_FILE_SIZE_EXCEEDED";
    var FAIL_FILE_TYPE_NOT_ALLOWED  = "FAIL_FILE_TYPE_NOT_ALLOWED";
    var FAIL_UNDEFINED_BEHAVIOR     = "FAIL_UNDEFINED_BEHAVIOR";

    function Plugin( element, options )
    {
        this.element  = element;
        this.$element = $(element);

        this.options   = $.extend( {}, defaults, options ) ;

        this._defaults = defaults;
        this._name     = pluginName;

        this.$file_field = undefined;
        this.dom_file = undefined;

        this.lock = false;

        init.call(this);

        if (this.options.debug)
        {
            log  = function() { console.log.apply (console, arguments); };
            warn = function() { console.warn.apply(console, arguments); };
        }
    }

    function init()
    {
        var self = this;

        if (this.$element[0] === undefined) {
            throw this._name + ' could not find <input type="file">';
        } else if (this.$element.attr("name") === undefined) {
            throw this._name + ' you must provide name atribute for the input file! Ex: <input type="file" name="myname">';
        }

        this.$element.on("change", function(event)
        {
            self.dom_file = self.$element[0].files[0];

            if (self.dom_file !== undefined)
            {
                file_field_on_change.call(self);
            }
            else
            {
                warn("Could not find the file input element! Probably change event without selecting a file?");
            }
        });
    }

    function submit()
    {
        var self = this;

        if (this.lock) {
            return;
        } else {
            lock.call(this);
        }

        var formData = new FormData();

        if (this.options.callbacks.sending) {
            this.options.callbacks.sending.call(this);
        } else {
            warn("sending callback is not bound");
        }

        formData.append( this.$element.attr("name"), this.dom_file);

        var promise = $.ajax({
            url: this.options.ajax_settings.url,
            type: this.options.ajax_settings.method,
            data: formData,
            processData: false,
            contentType: false,
        });

        promise
        .done(function( data, textStatus, jqXHR )
        {
            switch(jqXHR.status)
            {
                case 200:
                    if (self.options.callbacks.success) {
                        self.options.callbacks.success.call(self, data);
                    } else {
                        warn("success callback is not bound");
                    }
                break;

                case 202:
                    if(self.options.callbacks.pending) {
                        self.options.callbacks.pending.call(self, data);
                    } else {
                        warn("pending callback is not bound");
                    }

                    fetch_pending_image.call(self).done(function( fetch_data )
                    {
                        if (self.options.callbacks.success) {
                            self.options.callbacks.success.call(self, fetch_data);
                        } else {
                            warn("success callback is not bound");
                        }
                    });
                break;

                default:
                    warn("Unexpected status received in response!");
                break;
            }
        })
        .fail(function()
        {
            if (self.options.callbacks.fail) {
                self.options.callbacks.fail.call(self, FAIL_UNDEFINED_BEHAVIOR);
            } else {
                warn("fail callback is not bound");
            }
        })
        .always(function()
        {
            lock.call(self, false);
        });

        return promise;
    }

    function fetch_pending_image()
    {
        var self = this;

        function fetch()
        {
            return $.ajax({ url: self.options.ajax_settings.url_retry });
        }

        var $q = $.Deferred();

        var lock_fetch = false; // one per time, never allow parallel!

        var interval = setInterval(function()
        {
            if (lock_fetch) {
                return; // continue...
            }

            log("fetching...");
            lock_fetch = true;

            fetch()
            .done( function(data, textStatus, jqXHR)
            {
                switch(jqXHR.status)
                {
                    case 200:
                        // got it! halt the interval
                        clearInterval(interval);
                        $q.resolve( data );
                    break;

                    case 202:
                        // try again...
                        lock_fetch = false;
                    break;

                    default:
                        clearInterval(interval);
                        warn("Unexpected jqXHR.status[", jqXHR.status, "] in setInterval");
                    break;
                }
            });
        }, this.options.retry_fetch_interval);

        return $q;
    }

    function lock( lock_it )
    {
        if (lock_it === undefined) {
            lock_it = true;
        }

        this.lock = lock_it;
    }

    function file_field_on_change()
    {
        if (this.dom_file.size > this.options.MAX_FILE_SIZE)
        {
            warn("MAX_FILE_SIZE is: ", this.options.MAX_FILE_SIZE, ", file chosen is: ", this.dom_file.size);

            if (this.options.callbacks.fail) {
                this.options.callbacks.fail.call(this, FAIL_MAX_FILE_SIZE_EXCEEDED);
            } else {
                warn("fail callback is not bound");
            }
            return;
        }
        else if (this.options.FILE_TYPES.indexOf(this.dom_file.type) === -1)
        {
            warn("Mime type not allowed! ", this.dom_file.type);

            if (this.options.callbacks.fail) {
                this.options.callbacks.fail.call(this, FAIL_FILE_TYPE_NOT_ALLOWED);
            } else {
                warn("fail callback is not bound");
            }

            return;
        }
        else
        {
            submit.call(this);
        }
    }

    $.fn[pluginName] = function ( options )
    {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName))
            {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );