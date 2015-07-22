describe("ko.jsonSchema", function () {

    it("ko.jsonSchema object should exist", function () {
        expect(ko.jsonSchema).toBeDefined();
        expect(ko.jsonSchema.generate).toBeDefined();
        expect(ko.jsonSchema.generators).toBeDefined();
    });

    describe("main schema", function () {
        var schema = ko.jsonSchema.generate({});

        it("should have object type", function () {
            expect(schema.type).toEqual("object");
        });

        it("should have properties object", function () {
            expect(typeof schema.properties).toEqual("object");
        });

        it("should not allow additional properties", function () {
            expect(schema.additionalProperties).toEqual(false);
        });

        it("should fave a default title", function () {
            expect(schema.title).toBeDefined();
        });

        it("should fave a $schema property set json schema latest version", function () {
            expect(schema.$schema).toEqual("http://json-schema.org/draft-04/schema#");
        });
       
    });

    describe("settings", function () {        

            var person = {
                name: ko.observable("Avi"),
                age: ko.observable(30).extend({
                    required: true
                }),
                gender: ko.observable("Mail")
            };

            var settings = {
                ignore: ['name', 'gender'],
                title: "demo1 schema",
                additionalProperties: true
            };
            var schema = ko.jsonSchema.generate({ person: person }, settings);

            it("object with ignored properties should be defined", function () {
                expect(schema.properties.person).toBeDefined();
            });

            it("unignored properties should be generated", function () {
                expect(schema.properties.person.properties.age).toBeDefined();
            });

            it("unignored properties should not be generated", function () {
                expect(schema.properties.person.properties.name).not.toBeDefined();
                expect(schema.properties.person.properties.gender).not.toBeDefined();
            });

        
            it("title should be taken from the settings", function () {
                expect(schema.title).toEqual(settings.title);
            });

            it("additional properties should be taken from the settings", function () {
                expect(schema.properties.person.additionalProperties).toBeTruthy();
            });


    });


    describe("Object Type schema", function () {

        var person = {
            name: ko.observable("Avi"),
            age: ko.observable(30).extend({
                required: true
            })
        };
        person.getName = function () { return person.name };

        var schema = ko.jsonSchema.generate({ person: person });

        it("should be defined", function () {
            expect(schema.properties.person).toBeDefined();
        });

        it("should have object type", function () {
            expect(schema.properties.person.type).toEqual("object");
        });

        it("should have the object members defined under properties", function () {
            expect(schema.properties.person.properties.name).toBeDefined();
            expect(schema.properties.person.properties.age).toBeDefined();
        });

        it("should not have the object function members defined under properties", function () {
            expect(schema.properties.person.properties.getName).not.toBeDefined();
        });

        it("should not allow additional properties by default", function () {
            expect(schema.properties.person.additionalProperties).toEqual(false);
        });

        it("should have the required members generated as such", function () {
            expect(schema.properties.person.required).toBeDefined();
            expect(Array.isArray(schema.properties.person.required)).toBeTruthy();
            expect(schema.properties.person.required.indexOf("age")).toEqual(0);
            expect(schema.properties.person.required.indexOf("name")).toEqual(-1);
        });

        it("should allow additional properties when set to true on the object", function () {
            person.additionalProperties = true;
            schema = ko.jsonSchema.generate({ person: person });
            expect(schema.properties.person.properties.additionalProperties).not.toBeDefined();
            expect(schema.properties.person.additionalProperties).toEqual(true);
        });

        it("should  not allow additional properties when set to false on the object", function () {
            person.additionalProperties = false;
            schema = ko.jsonSchema.generate({ person: person });
            expect(schema.properties.person.properties.additionalProperties).not.toBeDefined();
            expect(schema.properties.person.additionalProperties).toEqual(false);
        });      

    });

    describe("Array with objects", function () {
        var Person = function (name, age) {
            this.name = ko.observable(name);
            this.age = ko.observable(age).extend({ required: true });
        }

        var schema = ko.jsonSchema.generate({ persons: [new Person("Benny", 40), new Person("Dani", 50)] });

        it("should b defined", function () {
            expect(schema.properties.persons).toBeDefined();
        });

        it("should have array type", function () {
            expect(schema.properties.persons.type).toEqual("array");
        });

        it("should have additional properties set to false", function () {
            expect(schema.properties.persons.additionalProperties).toEqual(false);
        });

        it("should have  object  defined under items", function () {
            expect(schema.properties.persons.items.type).toEqual("object");
        });

        it("should have  object  defined under items with additionalProperties set to false", function () {
            expect(schema.properties.persons.items.additionalProperties).toEqual(false);
        });

        it("should have  object  defined with the correct members", function () {
            expect(schema.properties.persons.items.properties.name).toBeDefined();
            expect(schema.properties.persons.items.properties.age).toBeDefined();
        });     

        it("should have the required members generated as such", function () {
            expect(schema.properties.persons.items.required).toBeDefined();
            expect(Array.isArray(schema.properties.persons.items.required)).toBeTruthy();
            expect(schema.properties.persons.items.required.indexOf("age")).toEqual(0);
            expect(schema.properties.persons.items.required.indexOf("name")).toEqual(-1);
        });

        it("should allow additional properties when set to true on the object", function () {
            Person.prototype.additionalProperties = true;
            schema = ko.jsonSchema.generate({ persons: [new Person("Benny", 40), new Person("Dani", 50)] });
            expect(schema.properties.persons.items.properties.additionalProperties).not.toBeDefined();
            expect(schema.properties.persons.additionalProperties).toEqual(true);
        });

        it("should  not allow additional properties when set to false on the object", function () {
            Person.prototype.additionalProperties = false;
            schema = ko.jsonSchema.generate({ persons: [new Person("Benny", 40), new Person("Dani", 50)] });
            expect(schema.properties.persons.items.properties.additionalProperties).not.toBeDefined();
            expect(schema.properties.persons.additionalProperties).toEqual(false);
        });
    });

    describe("observable", function () {

        var lastName;

        beforeEach(function () {
            lastName = ko.observable("COHEN");           
        });       
       

        it("should exist in the schema", function () {
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName).toBeDefined();
        });      

        it("string should have string as its type", function () {
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.required).toEqual(undefined);
        });

        it("none required should not have required contraint", function () {
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName).toBeDefined();
        });

        it("conditioned required should not have required contraint", function () {
            lastName.extend({ required: { onlyIf: function () { return true; } } } );
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName).toBeDefined();
        });

        it(" required should have required contraint", function () {
            lastName.extend({ required: true });
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.required).toBeDefined();
            expect(Array.isArray(schema.required)).toBeTruthy();
            expect(schema.required.indexOf("lastName")).toEqual(0);
        });      

    
        it("number should have number as its type", function () {
            lastName(100);
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.type).toEqual(["number", "null"]);
        });

        it("boolean should have number as its type", function () {
            lastName(true);
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.type).toEqual(["boolean","null"]);
        });

        it("null should have null as its type", function () {
            lastName(null);
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.type).toEqual(["null", "null"]);
        });

        it("undefined should have string as its type", function () {
            lastName(undefined);
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.type).toEqual(["string", "null"]);
        });

        it("minLength constraint should be generated", function () {
            lastName.extend({ minLength: 3 });
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.minLength).toEqual(3);        
        });

        it("maxLength constraint should be generated", function () {
            lastName.extend({ maxLength: 10 });
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.maxLength).toEqual(10);
        });

        it("maximal value constraint should be generated", function () {
            lastName.extend({ max: 10 });
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.maximum).toEqual(10);
        });

        it("minimal constraint should be generated", function () {
            lastName.extend({ min: 8 });
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.minimum).toEqual(8);
        });

        it("pattern should be generated", function () {
            var regexp = '^[a-zA-Z]+$';
            lastName.extend({ pattern: regexp });
            schema = ko.jsonSchema.generate({ lastName: lastName });
            expect(schema.properties.lastName.pattern).toEqual(regexp);
        });

        it("register new property to properties observable", function () {
            schema = ko.jsonSchema.registerObservableGenerator("foo", function () { return true;});
            expect(ko.jsonSchema.generators.observable.generators.foo).toBeDefined();
        });

    });


    describe("primitive types", function () {

        var schema;

        beforeEach(function () {
            schema = ko.jsonSchema.generate({ prop: ["Avi", "Dani", "Benny"] });
        });

        it("should exist in the schema", function () {
            schema = ko.jsonSchema.generate({ prop: "Avi" });
            expect(schema.properties.prop).toBeDefined();
        });

        it("strings should have the string type", function () {
            schema = ko.jsonSchema.generate({ prop: "Avi" });
            expect(schema.properties.prop.type).toEqual("string");
        });

        it("numbers should have the number type", function () {
            schema = ko.jsonSchema.generate({ prop: 50 });
            expect(schema.properties.prop.type).toEqual("number");
        });

        it("decimal numbers should have the number type", function () {
            schema = ko.jsonSchema.generate({ prop: 50.5 });
            expect(schema.properties.prop.type).toEqual("number");
        });

        it("booleans should have the boolean type", function () {
            schema = ko.jsonSchema.generate({ prop: false });
            expect(schema.properties.prop.type).toEqual("boolean");
        });

        it("undefined should have the string type", function () {
            schema = ko.jsonSchema.generate({ prop: undefined });
            expect(schema.properties.prop.type).toEqual("string");
        });

        it("null should have the null type", function () {
            schema = ko.jsonSchema.generate({ prop: null });
            expect(schema.properties.prop.type).toEqual("null");
        });
    });

    describe("custom schema", function () {

        var schema;

        var generators = JSON.parse(JSON.stringify(ko.jsonSchema.generators)); 

        afterEach(function () {
            ko.jsonSchema.generators = JSON.parse(JSON.stringify(generators));
        });

        it("boolean as string", function () {

            schema = ko.jsonSchema.generate({ prop: false });
            expect(schema.properties.prop.type).toEqual("boolean");

            ko.jsonSchema.registerGenerator("booleanType", {
                condition: function (property) { return typeof property === "boolean"; },
                generate: function (property) {
                    return {
                        "anyOf": [
                          {
                              "type": "boolean"
                          },
                          {
                              "type": "string",
                              "enum": [
                                "true",
                                "false"
                              ]
                          }
                        ]
                    };
                }
            });

            schema = ko.jsonSchema.generate({ prop: false });
            console.log(ko.toJSON(schema));
            expect(Array.isArray(schema.properties.prop.anyOf)).toBeTruthy();
        });

        it("custom bindings order", function () {                      

            ko.jsonSchema.registerGenerator("booleanType", {
                condition: function (property) { return typeof property === "boolean"; },
                generate: function (property) {
                    return {
                        type: "boolean"
                    };
                }
            });

            ko.jsonSchema.registerGenerator("primitiveType", {
                condition: function (property) { return typeof property !== "object"; },
                generate: function (property) {
                    return {
                        type: "string"
                    };
                }
            });

            schema = ko.jsonSchema.generate({ prop: false });
            expect(schema.properties.prop.type).toEqual("boolean");
        });


    });


    describe("simple array", function () {

        var schema;

        beforeEach(function () {
            schema = ko.jsonSchema.generate({ names: ["Avi", "Dani", "Benny"] });
        });

        it("should exist in the schema", function () {
            expect(schema.properties.names).toBeDefined();
        });

        it("should have array type", function () {
            expect(schema.properties.names.type).toEqual("array");
        });

        it("should have items property with the relevant type", function () {
            expect(schema.properties.names.items).toBeDefined;
            expect(typeof schema.properties.names.items.type).toEqual("string");
        });

        it("type is set according to the first entry in the array", function () {
            var schema = ko.jsonSchema.generate({ names: [25, "aaa", "bbb"] });
            expect(schema.properties.names.items.type).toEqual("number");
        });

        it("numeric type for numeric values in the array", function () {
            schema = ko.jsonSchema.generate({ names: [25, 26, 27] });
            expect(schema.properties.names.items).toBeDefined;
            expect(schema.properties.names.items.type).toEqual("number");
        });

        it("boolean type for boolean values in the array", function () {
            schema = ko.jsonSchema.generate({ names: [true, false, false] });
            expect(schema.properties.names.items).toBeDefined;
            expect(schema.properties.names.items.type).toEqual("boolean");
        });

        it("null type for null values in the array", function () {
            schema = ko.jsonSchema.generate({ names: [null] });
            expect(schema.properties.names.items).toBeDefined;
            expect(schema.properties.names.items.type).toEqual("null");
        });

        describe("empty array", function () {
            beforeEach(function () {
                schema = ko.jsonSchema.generate({ names: [] });
            });

            it("should have array type", function () {
                expect(schema.properties.names.type).toEqual("array");
            });

            it("should have items property with the string type", function () {
                expect(schema.properties.names.items).toBeDefined;
                expect(typeof schema.properties.names.items.type).toEqual("string");
            });
        });

    });

});


