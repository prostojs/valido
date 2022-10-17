import { validoIsNumber, validoIsString } from './validators'
import { Valido } from './valido'
import { TValidoDtoMeta, TValidoParamMeta } from './valido-types'

const dtoMeta: Record<string, TValidoDtoMeta & { params: Record<string, TValidoParamMeta>}> = {
    customValidator: {
        dto: { },
        typeName: 'customValidator',
        params: {
            _type: {},
            prop: {
                validators: [({ value }) => value === 'value' || 'expected value'],
            },
        },
    },
    multipleFields: {
        dto: { },
        typeName: 'multipleFields',
        requiredProps: ['name', 'age'],
        params: {
            _type: {},
            name: { validators: [validoIsString()], required: true },
            age: { validators: [validoIsNumber({ int: true, min: 12 })] },
            email: { validators: [validoIsString({ regex: /^[a-z0-9\.\-\_]+@[a-z\.\-\_]+\.[a-z]+$/, errorText: 'wrong email' })] },
            nested: { type: 'customValidator' },
        },
    },
    withArray: {
        dto: { },
        typeName: 'withArray',
        params: {
            _type: {},
            a: { arrayType: true },
            b: { arrayType: { maxLength: 2 }, validatorsOfItem: [validoIsNumber()] },
            c: { arrayType: { minLength: 1, itemType: () => () => '' } },
        },
    },
}

export const testValido = new Valido({
    getDtoMeta(value, type?) {
        return dtoMeta[(value as { _type: string })?._type]
    },
    getDtoParamMeta(value, type, key) {
        return dtoMeta[(value as { _type: string })?._type]?.params[key as keyof Record<string, TValidoParamMeta>]
    },
})
