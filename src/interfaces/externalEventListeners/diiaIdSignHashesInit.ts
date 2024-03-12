import { ExternalResponseBaseEventPayload } from '.'

export enum DiiaIdSignType {
    EU_SIGN_TYPE_CADES_BES = 1,
    EU_SIGN_TYPE_CADES_T = 4,
    EU_SIGN_TYPE_CADES_C = 8,
    EU_SIGN_TYPE_CADES_X_LONG = 16,
    EU_SIGN_TYPE_CADES_X_LONG_TRUSTED = 128,
    EU_SIGN_TYPE_CADES_X_LONG_TRUSTED_DIIA_SIGN_DSTU_EDITION = 144,
}

export interface DiiaIdSignHashesInitRequest {
    uuid: string
    request: {
        identifier: string
        certificateSerialNumber: string
        registryUserIdentifier: string
        signType?: DiiaIdSignType
        noSigningTime?: boolean
        noContentTimestamp?: boolean
    }
}

export interface DiiaIdSignHashesInitResponse {
    identifier: string
    success: boolean
}

export interface EventPayload extends ExternalResponseBaseEventPayload {
    response?: DiiaIdSignHashesInitResponse
}
