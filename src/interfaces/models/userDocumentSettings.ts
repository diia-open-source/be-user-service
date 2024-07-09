import { Document } from '@diia-inhouse/db'

export interface DocumentTypeSetting {
    documentTypeOrder: number
    documentIdentifiers?: {
        [key: string]: number
    }
    hiddenDocuments?: string[]
    /** Overrides defaultHidden field in documentSettings of document service */
    hiddenDocumentType?: boolean
}

export type DocumentTypeSettings = { [key in string]?: DocumentTypeSetting | unknown }

export interface UserDocumentSettings extends DocumentTypeSettings {
    userIdentifier: string
}

export interface UserDocumentSettingsModel extends UserDocumentSettings, Document {}
