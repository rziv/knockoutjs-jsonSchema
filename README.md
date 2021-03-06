# knockout-jsonSchema
*knockout-jsonSchema* is a [Knockout.js](http://knockoutjs.com/) plugin designed to generate a JSON schema according to [json-schema.org](http://json-schema.org/) specifications.
The generated JSON schema describes the valid JSON data for a given knockout view model including the data restrictions which were defined using the [Knockout-Validation](https://github.com/Knockout-Contrib/Knockout-Validation) library.

This allows you to easely generate a schema that can be used to validate your JSON data on the server side (using the technology of your pick), while keeping your model definitions and restirctions automatically in sync on both client and server.


Basic Usage
-----------
*knockout-jsonSchema* creates a `ko.jsonSchema` object.
To create a JSON schema simply use the generateSchema method.
The methods gets the knockout view model as the first parameter and an optional settings object as the second.

**generrate** *- ko.jsonSchema.generate(viewModel, [settings])*

```js
var viewModel = {
    person: {
        name: ko.observable("foo"),
        age: ko.observable(30)
    },
    discountEligibility: ko.observable(true)
};

ko.jsonSchema.generate(viewModel);
```
This opertaion will produce the following JSON schema:
```json
     {
        "title": "",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
            "person": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                  "age": {
                      "type": "string"
                  }
                },
              "additionalProperties": false
            },
          "discountEligibility": {
              "type": "string"
          }
        },
        "additionalProperties": false
    }
 ```

The basic knockout-validation definitions are supported so the validations on your
view model will be reflected in the JSON schema.
```js
   var viewModel = {
	   firstName: ko.observable("foo").extend({
					required: true,
					minLength: 3,
					pattern: {
						message: "Hey this doesnt match my pattern",
						params: "^[a-zA-Z]+$"
					}
			 })
   };

   ko.jsonSchema.generate(viewModel);
 ```
Now the firstName property in the schema has the restirctions defined by the knockout validation exetnders:

```  json
	{
  "title": "",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "firstName": {
      "minLength": 3,
      "pattern": "^[a-zA-Z]+$",
      "type": [
        "string",
        "null"
      ]
    }
  },
  "additionalProperties": false,
  "required": [
    "firstName"
  ]
}
```  
The **generate** method gets as its second parameter a set of key/value pairs that configure the schema generation:
*ignore* - an array with properties names that shouldn't be represented in the schema.
*additionalProperties* - defines weather properties that are not listed in the schema will be allowed when the schema is validated (the defeult is false).
additionalProperties can also be defined specifically on each object within the view model.
*title* - the title of the schema (metadata that isn't used for validation).

The following command will generate a schema that excludes the firstName and lastName properties, allows additional properties and has "sample schema" as its title:
```  javascript
   ko.jsonSchema.generate(viewModel,{ignore:['lastName','firstName'], additionalProperties: true, title: "sample schema"});
 ```

 Extending the Generator
 -----------------------
The plugin is extensible. For example, say that for boolean types you want the schema to allow not only boolean values but also their string representation.
This can be acheived by adding your own generator:
```  javascript
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
                              "enum": ["true","false"]
                          }
                        ]
                    };
                }
            });
```

Server Side Validation
-----------------------
In order to validate the JSON data on the server, you first have to export your view model, npm install ko-jsonschema and create the JSON schema.
Then, you can validate the json data against the schema with [any software](http://json-schema.org/implementations.html) that supports [version 4](http://json-schema.org/documentation.html) of the json schema specification.

Following is an example using [is-my-json-valid](https://github.com/mafintosh/is-my-json-valid/)
assuming you have exported a view model that contains a single required firstName property in src/viewModel.js:

```  javascript
var viewModel = require("./src/viewModel.js")
var jsonSchema = require("ko-jsonSchema")
var schema = jsonSchema.generate(viewModel)

var validator = require('is-my-json-valid')

var validate = validator(jsonSchema.generate(viewModel))

console.log('should be valid', validate({firstName: 'John'}))
console.log('should not be valid', validate({hello: 'world'}))
console.log(validate.errors)
```

To be sure, the view model in src/viewModel.js is defined as follows:
```  javascript
(function (factory) {
  "use strict";
  //CommonJS
  if (typeof exports === "object" && typeof module === "object") {
          require("knockout.validation");
          module.exports = factory(require("knockout"));
  //AMD
  } else if (typeof define === "function" && define.amd) {
      define(["knockout","knockout.validation"], factory);
  //normal script tag
  } else {
    window.viewModel = factory(ko);
  }
}(function (ko) {
                  return {
                         firstName: ko.observable("foo1").extend({
                                      required: true,
                                      minLength: 3,
                                      pattern: {
                                          message: "Hey this doesnt match my pattern",
                                          params: "^[a-zA-Z]+$"
                                      }
                               })
                  };
}
));
```


Dependencies
------------
* knockout 2.0+

Build
-----
This project uses [grunt](http://gruntjs.com/) for building/minifying.

Install from NPM
------------------
    npm install ko-jsonschema --save

License
-------
MIT [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
