import { Document } from 'mongoose'

import { DocumentType } from '@diia-inhouse/types'

export interface DocumentTypeSetting {
    documentTypeOrder: number
    documentIdentifiers?: {
        [key: string]: number
    }
    hiddenDocuments?: string[]
}

export type DocumentTypeSettings = { [key in DocumentType]?: DocumentTypeSetting }

export interface UserDocumentSettings extends DocumentTypeSettings {
    userIdentifier: string
}

export interface UserDocumentSettingsModel extends UserDocumentSettings, Document {}
