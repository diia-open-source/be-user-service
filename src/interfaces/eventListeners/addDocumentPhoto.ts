import { DocumentType } from '@diia-inhouse/types'

export interface EventPayload {
    userIdentifier: string
    documentType: DocumentType
    documentIdentifier: string
    photo: string
}
