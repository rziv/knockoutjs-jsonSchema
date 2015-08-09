(function (factory) {
  "use strict"; 
  //CommonJS
  if (typeof exports === "object" && typeof module === "object") {
          module.exports = factory(require('knockout'));
  //AMD
  } else if (typeof define === "function" && define.amd) {
      define(["knockout"], factory);
  //normal script tag
  } else {
      factory(ko);
  }
}(function (ko) {
  "use strict";
    var config;

    var defaultConfig = {
        title: "",
        ignore: [],
        additionalProperties: false
    };

    var extend = function (target, source) {
        for (var prop in source) {
            if (!target.hasOwnProperty(prop) && source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
        return target;
    };
    var addRequired = function (property) {
        if (!isRequired.call(this, property)) {
            return;
        }
        if (!this.required) {
            this.required = [];
        }
        this.required.push(property);
        delete this.properties[property].required;
    };
    var isRequired = function (property) {
        return (typeof this.properties === "object" && this.properties[property]
                  && this.properties[property].hasOwnProperty("required"));
    };

    var createMainSchema = function () {
        return {
            title: config.title,
            $schema: "http://json-schema.org/draft-04/schema#"
        };
    };

    var getAdditionalProperties = function (obj) {
        var additionalProperties = config.additionalProperties;
        if (obj && "additionalProperties" in obj) {
            additionalProperties = obj.additionalProperties;
            delete obj.additionalProperties;
        }
        return additionalProperties;
    };

    var generators = function () {
        /* jshint unused:false */
        var base = {
            condition: function (property) { throw new Error("not implemented"); },
            generate: function (property) { throw new Error("not implemented"); }
        };

        var simpleArray = extend(Object.create(base), {
            condition: function (property) { return Array.isArray(ko.unwrap(property)); },
            generate: function (property) {
                var self = {};
                self.type = "array",
                self.items = primitive.generate(ko.unwrap(property)[0]);
                return self;

            }
        });

        var complexArray = extend(Object.create(base), {
            condition: function (property) { return property !== null && typeof property === "object" && property.originallyArray; },
            generate: function (property) {
                var self = {};
                self.type = "array";
                self.items = objectType.generate(property);
                self.additionalProperties = getAdditionalProperties(property);
                return self;
            }
        });

        var objectType = extend(Object.create(base), {
            condition: function (property) { return property !== null && typeof property === "object"; },
            generate: function (property) {
                return {
                    type: "object",
                    properties: {},
                    additionalProperties: getAdditionalProperties(property)
                };
            }
        });

        var observable = extend(Object.create(base), {

            validations: {
                minLength: function (rule) {
                    this.minLength = rule.params;
                },

                maxLength: function (rule) {
                    this.maxLength = rule.params;
                },

                pattern: function (rule) {
                    this.pattern = rule.params;
                },

                max: function (rule) {
                    this.maximum = rule.params;
                },

                min: function (rule) {
                    this.minimum = rule.params;
                },

                required: function (rule) {

                    var alwaysRequired = function (rule) {
                        return !(rule && rule.hasOwnProperty("condition"));
                    };

                    if (alwaysRequired(rule)) {
                        this.required = true;
                    }

                }
            },

            generators: {

                rules: function (observable) {
                    var self = this;
                    if (observable.rules) {
                        // knockout validations exist
                        ko.utils.arrayForEach(observable.rules(), function (item) {
                            if (typeof generators.observable.validations[item.rule] === "function") {
                                generators.observable.validations[item.rule].call(self, item);
                            }
                        });
                    }
                },

                type: function (observable) {

                    this.type = ["string", "null"];

                    if (observable.observableType) {
                        if (observable.observableType in simpleTypes) {
                            this.type[0] = observable.observableType;
                        }
                    }

                    else if (typeof observable() !== "undefined") {
                        this.type[0] = (observable() === null) ? "null" : typeof observable();
                    }
                }
            },

            condition: function (property) { return (ko.isObservable(property) || ko.isComputed(property)); },
            generate: function (observable) {
                var self = {};

                for (var property in generators.observable.generators) {
                    if (typeof generators.observable.generators[property] === "function") {
                        generators.observable.generators[property].call(self, observable);
                    }
                }

                return self;
            }
        });

        var primitive = extend(Object.create(base), {
            condition: function (property) { return typeof property !== "function"; },
            generate: function (property) {
                return {
                    type: (typeof property === "undefined") ? "string" : (property === null) ? "null" : typeof property
                };
            }
        });
        return {
            base: base,
            simpleArray: simpleArray,
            complexArray: complexArray,
            objectType: objectType,
            observable: observable,
            primitive: primitive
        };
    }();


    var generatorEngine = function () {

        var schemaGenerators = [];

        var setSchemaGenerators = function () {
            schemaGenerators = [];
            for (var type in generators) {
                var generator = generators[type];
                if (generators.base.isPrototypeOf(generator)) {
                    insertGenerator(generator);
                }
            }

            function insertGenerator(generator) {
                if (generator.custom) {
                    //  custom generators are prioritized
                    schemaGenerators.splice(getLastCustomGeneratorIndex(), 0, generator);
                }
                else {
                    schemaGenerators.push(generator);
                }
            }

            function getLastCustomGeneratorIndex() {
                var i = 0;
                for (; schemaGenerators[i].custom && i < schemaGenerators.length; i++) {
                }
                return i;
            }

        };

        var generate = function (property) {
            if (schemaGenerators.length === 0) {
                setSchemaGenerators();
            }

            for (var i = 0, len = schemaGenerators.length; i < len; i++) {
                if (schemaGenerators[i].condition(property)) {
                    return schemaGenerators[i].generate(property);
                }
            }
        };

        return {
            generate: generate,
            setSchemaGenerators: setSchemaGenerators
        };
    }();

    var generateProperties = function (vm, subSchema) {

        for (var property in vm) {

            if (vm.hasOwnProperty(property) && config.ignore.indexOf(property) === -1) {

                var container = (subSchema.properties) ? subSchema.properties : subSchema.items.properties;

                container[property] = generatorEngine.generate(vm[property]);

                addRequired.call(subSchema.items || subSchema, property);

                if (typeof vm[property] === "object" && !Array.isArray(vm[property])) {
                    generateProperties(vm[property], container[property]);
                }
            }
        }

        return subSchema;
    };

    var registerGenerator = function (name, schema) {
        generators[name] = extend(Object.create(generators.base), schema);
        generators[name].custom = true;
        generatorEngine.setSchemaGenerators();
    };

    var modifyArraysForSchemaGeneration = function (vm) {

        var array;

        var removeAllButFirst = function () {
            // keep only the first entry in arrays and convert arrays with objects into objects
            array = array.slice(0, 1);
        };

        var objectize = function () {
            array = array[0];
        };

        var setArrayType = function () {
            // add an indication that the object was converted from an array
            Object.defineProperty(array, "originallyArray", {
                value: true,
                enumerable: false
            });
        };

        for (var property in vm) {

            if (vm.hasOwnProperty(property)) {

                if (typeof vm[property] === "object") {
                    modifyArraysForSchemaGeneration(vm[property]);
                }

                if (Array.isArray(ko.unwrap(vm[property]))) {
                    array = ko.unwrap(vm[property]);
                    removeAllButFirst();
                    if (typeof array[0] === "object" && array[0] !== null) {
                        objectize();
                        setArrayType();
                    }

                    vm[property] = array;
                }
            }
        }
        return vm;
    };

    var generate = function (vm, settings) {
        config = extend(settings || {}, defaultConfig);
        vm = modifyArraysForSchemaGeneration(vm);
        var properties = generateProperties(vm, generators.objectType.generate());
        return extend(createMainSchema(), properties);
    };

    var registerObservableGenerator = function (name, func) {
        generators.observable.generators[name] = func;
    };

    ko.jsonSchema = {
      generate: generate,
      registerGenerator:registerGenerator,
      registerObservableGenerator :registerObservableGenerator,
      generators:generators
    }

    return ko.jsonSchema;
}
));
