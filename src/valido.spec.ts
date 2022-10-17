import { validoIsBoolean, validoIsNumber, validoIsString } from './validators'
import { TValidoParamMeta } from './valido-types'
import { testValido } from './valido.artifacts'

describe('valido', () => {
    describe('param validation', () => {
        it('must validate required param', async () => {
            const paramMetaRequired: TValidoParamMeta = { required: true }
            const paramMeta: TValidoParamMeta = { required: false }
            expect(await testValido.validateParam(undefined, paramMeta, 'testParam')).toEqual(true)
            expect(await testValido.validateParam(undefined, paramMetaRequired, 'testParam')).toEqual('Field "testParam" is required')
            expect(await testValido.validateParam(0, paramMetaRequired, 'testParam')).toEqual(true)
        })
        it('must validate param validators', async () => {
            const paramMeta: TValidoParamMeta = {
                validators: [({value}) => value as number > 5 || 'value is wrong'],
            }
            expect(await testValido.validateParam(4, paramMeta, 'testParam')).toEqual('value is wrong')
            expect(await testValido.validateParam(6, paramMeta, 'testParam')).toEqual(true)
        })
        it('must validate param validoIsString', async () => {
            const paramMeta1: TValidoParamMeta = { validators: [validoIsString()] }
            expect(await testValido.validateParam(5, paramMeta1, 'testParam')).toEqual('"testParam" string expected')
            expect(await testValido.validateParam('6', paramMeta1, 'testParam')).toEqual(true)
            const paramMeta2: TValidoParamMeta = { validators: [validoIsString({ maxLength: 2 })] }
            expect(await testValido.validateParam('123', paramMeta2, 'testParam')).toEqual('"testParam" does not satisfy max length 2')
            expect(await testValido.validateParam('12', paramMeta2, 'testParam')).toEqual(true)
            const paramMeta3: TValidoParamMeta = { validators: [validoIsString({ minLength: 2 })] }
            expect(await testValido.validateParam('1', paramMeta3, 'testParam')).toEqual('"testParam" does not satisfy min length 2')
            expect(await testValido.validateParam('12', paramMeta3, 'testParam')).toEqual(true)
            const paramMeta4: TValidoParamMeta = { validators: [validoIsString({ regex: /^[0-1]+$/ })] }
            expect(await testValido.validateParam('012', paramMeta4, 'testParam')).toEqual('"testParam" does not satisfy regex /^[0-1]+$/')
            expect(await testValido.validateParam('010', paramMeta4, 'testParam')).toEqual(true)
        })
        it('must validate param validoIsNumber', async () => {
            const paramMeta1: TValidoParamMeta = { validators: [validoIsNumber()] }
            expect(await testValido.validateParam('5', paramMeta1, 'testParam')).toEqual('"testParam" number expected')
            expect(await testValido.validateParam(6, paramMeta1, 'testParam')).toEqual(true)
            const paramMeta2: TValidoParamMeta = { validators: [validoIsNumber({ max: 5 })] }
            expect(await testValido.validateParam(6, paramMeta2, 'testParam')).toEqual('"testParam" does not satisfy max = 5')
            expect(await testValido.validateParam(5, paramMeta2, 'testParam')).toEqual(true)
            const paramMeta3: TValidoParamMeta = { validators: [validoIsNumber({ min: 5 })] }
            expect(await testValido.validateParam(4, paramMeta3, 'testParam')).toEqual('"testParam" does not satisfy min = 5')
            expect(await testValido.validateParam(5, paramMeta3, 'testParam')).toEqual(true)
        })
        it('must validate param validoIsBoolean', async () => {
            const paramMeta1: TValidoParamMeta = { validators: [validoIsBoolean()] }
            expect(await testValido.validateParam('true', paramMeta1, 'testParam')).toEqual('"testParam" boolean expected')
            expect(await testValido.validateParam('false', paramMeta1, 'testParam')).toEqual('"testParam" boolean expected')
            expect(await testValido.validateParam(0, paramMeta1, 'testParam')).toEqual('"testParam" boolean expected')
            expect(await testValido.validateParam(1, paramMeta1, 'testParam')).toEqual('"testParam" boolean expected')
            expect(await testValido.validateParam(true, paramMeta1, 'testParam')).toEqual(true)
            expect(await testValido.validateParam(false, paramMeta1, 'testParam')).toEqual(true)
        })
    })

    describe('dto validation', () => {
        it('must validate property', async () => {
            expect(await testValido.validateDTO({
                _type: 'customValidator',
                prop: 'random',
            })).toEqual({ prop: 'expected value' })
            expect(await testValido.validateDTO({
                _type: 'customValidator',
                prop: 'value',
            })).toEqual(true)
        })
        it('must validate several properties', async () => {
            expect(await testValido.validateDTO({
                _type: 'multipleFields',
                age: 5,
            })).toEqual({
                age: '"age" does not satisfy min = 12',
                name: 'Field "name" is required',
            })
            expect(await testValido.validateDTO({
                _type: 'multipleFields',
                age: 15,
                name: 'John',
                email: 'test.email',
            })).toEqual({
                email: 'wrong email',
            })
            expect(await testValido.validateDTO({
                _type: 'multipleFields',
                age: 15,
                name: 'John',
                email: 'john@mail.com',
            })).toEqual(true)
        })
        it('must not allow unspecified fields', async () => {
            expect(await testValido.validateDTO({
                _type: 'customValidator',
                prop: 'value',
                newProp: 'test',
            })).toEqual({ newProp: 'Unexpected field "newProp"' })
        })
        it('must validate nested objects', async () => {
            expect(await testValido.validateDTO({
                _type: 'multipleFields',
                age: 15,
                name: 'John',
                email: 'john@mail.com',
                nested: {
                    _type: 'customValidator',
                    prop: 'test',
                },
            })).toEqual({ nested: { prop: 'expected value'} })
            expect(await testValido.validateDTO({
                _type: 'multipleFields',
                age: 15,
                name: 'John',
                email: 'john@mail.com',
                nested: {
                    _type: 'customValidator',
                    prop: 'value',
                },
            })).toEqual(true)
        })
        it('must validate arrays', async () => {
            expect(await testValido.validateDTO({
                _type: 'withArray',
                a: 'abc',
            })).toEqual({ a: '"a" array expected' })
            expect(await testValido.validateDTO({
                _type: 'withArray',
                a: ['abc'],
            })).toEqual(true)
        })
        it('must validate arrays with item validators', async () => {
            expect(await testValido.validateDTO({
                _type: 'withArray',
                b: ['abc'],
            })).toEqual({ b: ['"b[0]" number expected'] })
            expect(await testValido.validateDTO({
                _type: 'withArray',
                b: [1, 2, 3],
            })).toEqual({ b: '"b" does not satisfy max length 2' })
            expect(await testValido.validateDTO({
                _type: 'withArray',
                b: [1, 2],
            })).toEqual(true)
        })
        it('must validate arrays with nested objects', async () => {
            expect(await testValido.validateDTO({
                _type: 'withArray',
                c: [],
            })).toEqual({ c: '"c" does not satisfy min length 1' })
            expect(await testValido.validateDTO({
                _type: 'withArray',
                c: [{
                    _type: 'customValidator',
                    prop: 'test',
                }],
            })).toEqual({ c: [{
                prop: 'expected value',
            }],
            })
            expect(await testValido.validateDTO({
                _type: 'withArray',
                c: [{
                    _type: 'customValidator',
                    prop: 'value',
                }],
            })).toEqual(true)
        })
    })
})
