import { HttpStatusCode } from '@diia-inhouse/types'

import { OperationState, SubscribeRequestLng } from './ubch'

export interface AuthRequest {
    doc: {
        auth: {
            login: string
            pass: string
        }
    }
}

export interface AuthResponse {
    doc: {
        auth: {
            errcode?: number
            errtext?: string
            errtextclient?: string
            sessid?: string
        }
    }
}

export interface BaseRequest {
    sessid: string
    lng: SubscribeRequestLng
}

export interface SubscribeRequest {
    inn: string
}

export interface UnsubscribeRequest {
    refagr: string
    inn?: string
}

export type UbchRequest = SubscribeRequest | UnsubscribeRequest

export interface BaseResponse {
    name: string
    message: string
    code: number
    status: HttpStatusCode
    type: string
}

export interface SubscribeResponse extends BaseResponse {
    data: {
        refagr: string
        operationstate: OperationState
        servicestate: OperationState
    }
}

export interface UnsubscribeResponse extends BaseResponse {
    data: {
        inn: string
        refagr: string
        operationstate: OperationState
        servicestate: OperationState
    }
}
