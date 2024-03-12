import { DiiaOfficeProfileData, DocumentType, ProfileFeature } from '@diia-inhouse/types'

export interface DocumentTypeWithOrder {
    order: number
    documentType: DocumentType
}

export interface SaveDocumentsOrderByDocumentTypeRequest {
    order: number
    docNumber: string
}

export interface UserDocumentsOrderResponse {
    documentType: DocumentType
    documentIdentifiers?: string[]
}

export interface UserDocumentsOrderParams {
    userIdentifier: string
    features?: {
        [ProfileFeature.office]?: DiiaOfficeProfileData
    }
}
