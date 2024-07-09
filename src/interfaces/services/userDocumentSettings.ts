import { DiiaOfficeProfileData, ProfileFeature, SessionType } from '@diia-inhouse/types'

export interface DocumentTypeWithOrder {
    order: number
    documentType: string
}

export interface SaveDocumentsOrderByDocumentTypeRequest {
    order: number
    docNumber: string
}

export interface UserDocumentsOrderResponse {
    documentType: string
    documentIdentifiers?: string[]
}

export interface UserDocumentsOrderParams {
    userIdentifier: string
    features?: {
        [ProfileFeature.office]?: DiiaOfficeProfileData
    }
}

export interface DocumentVisibilitySettings {
    hiddenDocuments: string[]
    hiddenDocumentType: boolean
}

export type DocumentsDefaultOrder = Partial<Record<SessionType, { items: string[] }>>
