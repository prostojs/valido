import { TFunction, TObject } from './types'
import { TValidoDtoOptions, TValidoFnOptions, TValidoOptions, TValidoParamMeta, TValidoFn } from './valido-types'

const DEFAULT_ERROR_LIMIT = 10

export class Valido {
    constructor(protected options: TValidoOptions) {}

    async validateParam(_value: unknown, meta: TValidoParamMeta, key?: string | symbol | number, dtoOptions?: TValidoDtoOptions, obj?: unknown, parent?: unknown, errorCount = 0, globalErrorCount = 0, globalErrorLimit?: number, restoreCtx?: () => void): Promise<true | string | TObject>  {
        let result: string | true | TObject | (string | true | TObject)[] = true
        const errorLimit = dtoOptions?.errorLimit || this.options.errorLimit || DEFAULT_ERROR_LIMIT
        if (!globalErrorLimit) {
            globalErrorLimit = errorLimit
        }
        if (meta?.required) {
            if (_value === undefined || _value === null) {
                return `Field "${ (meta.label || key || '').toString() }" is required`
            }
        }
        if (typeof _value === 'undefined' && !meta?.required) return true
        if (meta?.validators && meta.validators.length) {
            result = await runValidators({
                options: dtoOptions || {},
                parent,
                object: obj,
                type: meta.type,
                value: _value,
                key: key as string,
                label: (meta.label || key || '').toString(),
            }, meta.validators, restoreCtx)
        }
        if (result !== true) return result
        if (!meta && dtoOptions && !dtoOptions.allowExtraFields) {
            return `Unexpected field "${ key as string }"`
        }
        if (meta?.arrayType) {
            if (!Array.isArray(_value)) {
                return `"${ (meta.label || key || '').toString() }" array expected`
            }
            if (typeof meta.arrayType === 'object') {
                if (typeof meta.arrayType.minLength === 'number' && _value.length < meta.arrayType.minLength) {
                    return `"${ (meta.label || key || '').toString() }" does not satisfy min length ${ meta.arrayType.minLength }`
                }
                if (typeof meta.arrayType.maxLength === 'number' && _value.length > meta.arrayType.maxLength) {
                    return `"${ (meta.label || key || '').toString() }" does not satisfy max length ${ meta.arrayType.maxLength }`
                }
                if (typeof meta.arrayType.itemType === 'function' || meta.validatorsOfItem) {
                    const arr = _value as unknown[]
                    const itemMeta = {
                        ...meta,
                        validators: meta.validatorsOfItem,
                        validatorsOfItem: [],
                        arrayType: undefined,
                    }
                    for (let i = 0; i < arr.length; i++) {
                        const item = arr[i]                   
                        restoreCtx && restoreCtx()
                        itemMeta.type = meta.arrayType.itemType ? await meta.arrayType.itemType(item, i) : undefined
                        const validationResult = await this.validateParam(item, itemMeta, `${key as string || ''}[${i}]`, dtoOptions, obj, parent, errorLimit, globalErrorCount, globalErrorLimit, restoreCtx)
                        if (validationResult !== true) {
                            result = (Array.isArray(result) ? result : []) as (string | true | TObject)[];
                            (result as (string | true | TObject)[])[i] = validationResult
                            globalErrorCount++
                            errorCount++
                            if (globalErrorCount >= globalErrorLimit || errorCount >= errorLimit) return result
                        }
                    }
                }
            }
        } else if (result === true && meta?.type) {
            result = await this.validateDTO(_value, meta.type, obj, globalErrorCount, globalErrorLimit, restoreCtx)
        }
        return result
    }

    async validateDTO(value: unknown, _type?: unknown, parent?: unknown, globalErrorCount = 0, globalErrorLimit?: number, restoreCtx?: () => void): Promise<true | string | TObject> {
        const meta = await this.options.getDtoMeta(value, _type)
        if (!meta?.dto) return true
        if (typeof value !== 'object') {
            return `Expected object, got "${ typeof value }"`
        }
        let noErrors = true
        const dtoOptions = meta?.dto || { errorLimit: this.options.errorLimit || DEFAULT_ERROR_LIMIT }
        const errorLimit = dtoOptions.errorLimit || this.options.errorLimit || DEFAULT_ERROR_LIMIT
        if (!globalErrorLimit) {
            globalErrorLimit = errorLimit
        }
        let errorCount = 0
        const obj = value as TObject
        const keys = Object.keys(obj) as (keyof typeof obj)[]
        const result: Record<string | symbol, string | TObject | unknown[]> = {}
        const requiredProps = meta?.requiredProps || []
        const missingKeys = requiredProps.filter(k => !keys.includes(k as keyof typeof obj)) as (keyof typeof obj)[]
        for (const key of [...keys, ...missingKeys]) {
            const prop = obj[key]
            const propMeta = await this.options.getDtoParamMeta(value, _type, key)
            const validationResult = await this.validateParam(prop, propMeta, key, dtoOptions, obj, parent, errorCount, globalErrorCount, globalErrorLimit, restoreCtx)
            if (validationResult !== true) {
                noErrors = false
                if (!Array.isArray(validationResult)) {
                    globalErrorCount++
                    errorCount++
                }
                result[key] = validationResult
                if (globalErrorCount >= globalErrorLimit || errorCount >= errorLimit) return result
            }
        }
        return noErrors || result
    }
}

async function runValidators(opts: TValidoFnOptions, validators: TValidoFn[], restoreCtx?: TFunction) {
    let result: string | true | TObject | Promise<string> | Promise<true> | Promise<TObject> = true
    for (const validator of validators) {
        restoreCtx && restoreCtx()
        result = await validator(opts)
        if (result !== true) break
    }
    return result
}
