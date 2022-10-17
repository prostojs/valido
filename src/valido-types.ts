import { TFunction, TObject } from './types'

export interface TValidoParamMeta {
    required?: boolean
    label?: string
    validators?: TValidoFn[]
    validatorsOfItem?: TValidoFn[]
    arrayType?: true | TValidoArrayOptions
    type?: unknown
}

export interface TValidoDtoMeta {
    label?: string
    dto?: TValidoDtoOptions
    typeName?: string
    requiredProps?: (string | symbol)[]
}

export interface TValidoFnOptions<T = unknown> {
    key?: string
    label?: string
    type: unknown
    parent?: unknown
    object?: unknown
    value: T
    options: TValidoDtoOptions
}

export interface TValidoDtoOptions {
    errorLimit?: number
    allowExtraFields?: boolean
}

export type TValidoFn<T = unknown> = (options: TValidoFnOptions<T>) => string | true | TObject | Promise<string> | Promise<true> | Promise<TObject>

export interface TValidoArrayOptions<T = unknown> {
    itemType?: (item: T, index: number) => Promise<TFunction> | TFunction // must return type constructor
    minLength?: number
    maxLength?: number
}

export interface TValidoOptions {
    errorLimit?: number
    getDtoMeta: (value: unknown, type?: unknown) => Promise<TValidoDtoMeta | undefined> | TValidoDtoMeta | undefined
    getDtoParamMeta: (value: unknown, type: unknown, key: string | symbol) => Promise<TValidoParamMeta> | TValidoParamMeta
}
