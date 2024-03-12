import { HttpStatusCode } from '@diia-inhouse/types'

export enum SubscribeRequestLng {
    Ua = 'UA',
    Ru = 'RU',
    En = 'EN',
}

export enum OperationState {
    Y = 'Y',
    N = 'N',
}

export interface UbchRequest {
    data: string
}

export interface SubscribeRequestData {
    method: 'Rega'
    sessid: string
    inn: string
    lng: SubscribeRequestLng
}

export interface UnsubscribeRequestData {
    method: 'Disc'
    sessid: string
    inn: string
    lng: SubscribeRequestLng
    refagr: string
}

export type UbchRequestData = SubscribeRequestData | UnsubscribeRequestData

export interface UbchResponse {
    data: string
}

export interface UbchResponseData {
    name: string
    message: string
    code: number
    status: HttpStatusCode
    type: string
    data?: {
        inn: string
        refagr: string
        servicestate: OperationState
    }
}
