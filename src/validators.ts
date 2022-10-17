import { TValidoFn } from './valido-types'

export function validoIsTypeOf(type: 'string' | 'object' | 'number' | 'boolean', errorText?: string): TValidoFn {
    return ({value, label, key}) => {
        return typeof value === type || errorText || `"${ label || key || '' }" ${ type } expected`
    }
}
export function validoIsString(opts?: {
    minLength?: number
    maxLength?: number
    regex?: RegExp
    errorText?: string
}): TValidoFn {
    return (meta) => {
        const result = validoIsTypeOf('string', opts?.errorText)(meta)
        if (result === true && opts) {
            const {label, key} = meta
            const value = meta.value as string
            if (typeof opts.minLength === 'number' && value.length < opts.minLength ) return opts.errorText || `"${ label || key || '' }" does not satisfy min length ${ opts.minLength }`
            if (typeof opts.maxLength === 'number' && value.length > opts.maxLength ) return opts.errorText || `"${ label || key || '' }" does not satisfy max length ${ opts.maxLength }`
            if (typeof opts.regex === 'object' && !opts.regex.test(value)) return opts.errorText || `"${ label || key || '' }" does not satisfy regex ${ opts.regex.toString() }`
        }
        return result
    }
}

export function validoIsNumber(opts?: {
    min?: number
    max?: number
    int?: boolean
    errorText?: string
}): TValidoFn {
    return (meta) => {
        const result = validoIsTypeOf('number', opts?.errorText)(meta)
        if (result === true && opts) {
            const {label, key} = meta
            const value = meta.value as number
            if (typeof opts.min === 'number' && value < opts.min ) return opts.errorText || `"${ label || key || '' }" does not satisfy min = ${ opts.min }`
            if (typeof opts.max === 'number' && value > opts.max ) return opts.errorText || `"${ label || key || '' }" does not satisfy max = ${ opts.max }`
            if (opts.int && !Number.isInteger(value)) return opts.errorText || `"${ label || key || '' }" expected to be integer number`
        }
        return result
    }
}

export function validoIsBoolean(opts?: {
    errorText?: string
}): TValidoFn {
    return (meta) => {
        const result = validoIsTypeOf('boolean', opts?.errorText)(meta)
        // if (result === true && opts) {
        //     // additional checks?
        //     const {label, key} = meta
        //     const value = meta.value as boolean
        // }
        return result
    }
}
