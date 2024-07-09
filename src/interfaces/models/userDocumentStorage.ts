import { Document } from '@diia-inhouse/db'

export interface UserDocumentStorage {
    userIdentifier: string
    mobileUid?: string
    hashData: string
    documentType: string
    encryptedData: string
    encryptedPhoto?: string
    encryptedDocPhoto?: string
}

export interface UserDocumentStorageModel extends UserDocumentStorage, Document {}
