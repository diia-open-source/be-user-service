import { Document } from 'mongoose'

import { IdentityDocumentType } from '@interfaces/services/documents'

export enum SignAlgo {
    DSTU = 'DSTU',
    ECDSA = 'ECDSA',
}

export interface DiiaIdRevoking {
    eventUuid: string
    error?: string
}

export interface DiiaId {
    userIdentifier: string
    mobileUid: string
    identifier: string
    creationDate?: Date
    expirationDate?: Date
    isDeleted: boolean
    deletedAt?: Date
    identityDocumentType?: IdentityDocumentType
    revoking?: DiiaIdRevoking
    signAlgo: SignAlgo
    registryUserIdentifier?: string
    certificateSerialNumber?: string
}

export interface DiiaIdModel extends DiiaId, Document {
    createdAt?: Date
}
