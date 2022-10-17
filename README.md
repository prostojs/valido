# prostojs/valido

Valido is a validation framework. It implements the validation routines against objects and single values with no coupling to any of the validation definition solution. So the definition of validation is passed via options callbacks to the instance of Valido.

Valido supports:
- validation of a single value (param)
- validation of an object (class)
- validation of a nested object (class)
- validation of an array items (as a single values or as nested objects)

Valido provides a validation result in a format that matches the validated object, the values of validated properties are filled with the error texts.
If the validation passed then the returned value is `true`.

## Install

`npm install @prostojs/valido`

## How to use it

```ts
const { Valido } = require('@prostojs/valido')

const valido = new Valido({
    // errorLimit specifies the amount of errors after
    // which it'll stop validation of the object
    // (10 by default)
    errorLimit: 10,

    // getDtoMeta is a callback used to provide the
    // Data Transfer Object (DTO) definition (metadata)
    // Here you can inject whatever validation definition
    // you want to use (e.g. read class metadata, read DB etc.)
    //
    // @param value - the object itself
    // @param type - the object type (class)
    async getDtoMeta(value, type?) {
        return {
            // label is optional, can be used in error texts
            label: 'value label',
            
            // dto optional, defines dto options
            dto: { 
                // errorLimit defines maximum errors
                // to stop validation (by default 10)
                errorLimit: 10,

                // allowExtraFields, when true, will
                // ignore any extra fields in object
                allowExtraFields: false,
            },

            // typeName is optional, defines the type
            // name, usually it is classname (type.name)
            // may be used in error texts
            typeName: 'MyClassToValidate',

            // requiredProps is an array of string | symbol
            // that lists all the required props
            requiredProps: ['prop1', 'prop2'],           
        } // TValidoDtoMeta
    },

    // getDtoParamMeta is a callback used to provide
    // param validation definition (metadata)
    // Here you can inject whatever validation definition
    // you want to use (e.g. read method params metadata, read DB etc.)
    //
    // @param value - the param value
    // @param type - the param type
    // @param key - the param key
    async getDtoParamMeta(value, type, key) {
        return {
            // required is optional, specifies
            // if the param (field) is required
            required: true,

            // label is optional, can be used in error texts
            // to label the param (field)
            label: 'Field label',

            // validators is optional, contains an array
            // of validator functions
            validators: [
                ({value, label, key}) => 
                    value > 0 ? true : `${label || key} must be gt than 0`,
            ],

            // validatorsOfItem is optional, contains
            // validator functions for each item (for arrays)
            validatorsOfItem: [
                ({value, label, key}) => 
                    value > 1 ? true : `${label || key} must be gt than 1`,
            ],

            // arrayType is optional, marks the param (field)
            // as an array to apply array checks
            // can take boolean value
            // or an object with options:
            arrayType: {
                // itemType is optional, is a callback that returns
                // the item type (class constructor)
                itemType: () => MyClass,

                // minLength is optional, specifies the
                // min expected length of the array
                minLength: 1,

                // maxLength is optional, specifies the
                // max expected length of the array
                maxLength: 5,
            },

            // type is optional, provides the type of the
            // current param (field)
            type: type,
        } // TValidoParamMeta
    },
})

// when all the injections with proper validation
// definitions are set we are ready for validations:

// validation of an object:
// assuming that we have some class "MyClass"
// that supports validations
// and some object "myObject" that should
// match to the MyClass validation definition
valido.validateDTO(myObject, MyClass)

// validation of a single value
valido.validateParam(myObject, {
    ... // TValidoParamMeta
})
```

## Pre-defined validation functions

Valido provides few generic validators:
- `validoIsTypeOf('type_name')` - validates if the value is of specified type
- `validoIsString({...})` - validates if the value is of `string` type, accepts options like `minLength`, `maxLength`, `regex` and `errorText`
- `validoIsNumber({...})` - validates if the value is of `number` type, accepts options like `min`, `max` and `errorText`
- `validoIsBoolean()` - validates if the value is of `boolean` type

### Example of usage
```ts
{
    ...
    validators: [
        // will validate the string of min length of 5 characters
        validoIsString({ minLength: 5 }),

        // will validate the number which must be less than 101
        validoIsNumber({ max: 100 }),

        // will validate that the value is of boolean type
        validoIsBoolean(),

        // will validate that the value is of object type
        validoIsTypeOf('object'),
    ],
    ...
}
```

## How to add a custom validator

Any function that satisfies `TValidoFn` type can be a custom validator function, but usually it makes sense to write a factory function that accepts some options and returns `TValidoFn`:

```ts
// an example of validator that
// checks if the value is compatible with Date
function isDateCompatible(opts?: {
    errorText?: string
}): TValidoFn {
    return ({value, label, key}) => {
        const notCompatible = Number.isNaN(new Date(value).getTime())
        return notCompatible ? errorText || `"${ label || key || '' }" not compatible with Date` : true
    }
}
```
