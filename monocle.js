define(['./inflector', './mustache'], function () {
  
    function Monocle(options) {
        var defaults = {
            // Wrapper into which a preliminary (uncached) template will be rendered
            wrapper: '<p {{attributes}}>{{{partial}}}</p>',
            // Partials which are selected based on the result of 'typeof data[key]'
            partials: {
                string: '<label for="{{id}}">{{name}}</label><input data-bind="{{key}}" id="{{id}}" {{attributes}} type="text" value="{{value}}" />',
                number: '<label for="{{id}}">{{name}}</label><input data-bind="{{key}}" id="{{id}}" {{attributes}} type="text" value="{{value}}" />',
                object: '<label for="{{id}}">{{name}}</label><select data-bind="{{key}}" id="{{id}}" {{attributes}} type="text" value="{{value}} />',
                boolean: '<span><input data-bind="{{key}}" id="{{id}}" {{attributes}} type="checkbox" value="{{value}}" /><label for="{{id}}">{{name}}</label></span>',
            },
            // Attributes (if any) which will be applied to both the wrapper and the partial 
            // (following the same type selection rules as partials)
            attributes: {
                string: { class: 'text medium' },
                number: { class: 'text medium' },
                object: { class: 'text medium' },
                boolean: { class: 'checkbox' },
            }
        }

        var settings = $.extend({}, defaults, options),
            cache = {};

        // Add mustaches to a string, as well as an optional '>' partial denotation
        function mustache(value, partial) {
            return ['{{', partial ? '>' : '', value, '}}'].join('');
        }

        // Flatten the type's specified attributes into an html string
        function flattenAttributes(type) {
            var attributes = settings.attributes[type],
                flattened = [];

            $.each(attributes, function (key, value) {
                flattened.push(key + '="' + value + '"');
            });

            return flattened.join(' ');
        }

        // Applicator which is applied to the wrapper to generate a preliminary template
        // Note: {{name}}, {{value}}, and {{{partial}}} inside the wrapper + partials are determined here
        function applicator(type, key) {
            return {
                id: 'mid-' + key,
                key: key,
                name: key.underscore().titleize(),
                value: mustache(key),
                attributes: flattenAttributes(type),
                // Lambda, to prevent Mustache from evaluating the 'staches
                partial: function () {
                    return mustache(type, true);
                }
            }
        }

        // Render a preliminary template based on the key and typeof value
        function renderPartial(key, value) {
            var type = typeof value || 'string',
                data = applicator(type, key),
                partial = Mustache.to_html(settings.wrapper, data, {});

            return Mustache.to_html(partial, data, settings.partials);
        }

        // The key which will be used to store a template in the cache
        function generateCacheKey(data) {
            var keys = [];

            $.each(data, function (key) {
                keys.push(key);
            });

            return keys.join('');
        };

        // Creates and inserts or retrieves a template 
        // from the cache for the specified object
        this.templatise = this.templatize = function (data) {
            if (!$.isPlainObject(data) || $.isEmptyObject(data)) {
                throw 'Invalid object';
            }

            var cacheKey = generateCacheKey(data),
                template = cache[cacheKey];

            if (typeof template === 'undefined') {
                var builder = [];

                // Build a partial for each property
                $.each(data, function (key, value) {
                    builder.push(renderPartial(key, value));
                });

                // Flatten the array and store it in the cache with 
                // the previously generated cacheKey
                template = cache[cacheKey] = builder.join('\r\n');
            }

            return template;
        };

        // Creates or retrieves a template from the cache and 
        // applies it to the object, returning the html result
        // data: the object to render into a template
        // spec: an array of property keys
        // exclude: whether to exclude or include properties based on the spec
        this.render = function (data, spec, include) {
            var copy = include ? {} : $.extend({}, data);

            $.each(spec, function (index, value) {
                if (include) {
                    copy[value] = data[value];
                } else {
                    delete copy[value];
                }
            });

            return Mustache.to_html(this.templatise(copy), copy, {});
        };

        // Clears the template cache
        this.clearAll = function () {
            cache = {};
        };

        // Returns copy of template cache
        this.showAll = function () {
            return $.extend({}, cache);
        };
    }

    window.monocle = new Monocle();

});