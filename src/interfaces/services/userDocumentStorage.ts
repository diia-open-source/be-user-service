import { DocumentType } from '@diia-inhouse/types'

export type EncryptedDataByDocumentType = {
    [key in DocumentType]?: string[]
}

export type DecryptedDocument = Record<string, unknown> & { photo?: string; docPhoto?: string }

export type DecryptedDocuments = Partial<Record<DocumentType, DecryptedDocument[]>>

export enum VaccinationCertificateType {
    Vaccination = 'vaccination',
    Test = 'test',
    Recovery = 'recovery',
}

export interface StoredMedicalData {
    id: string
    documentType: DocumentType
    documentIdentifier: string
    vaccinations: unknown[]
    tests: unknown[]
    recoveries: unknown[]
}

export interface StoredBirthCertificateData {
    id: string
    serie: string
    number: string
}

export interface AddDocumentOps {
    mobileUid?: string
    compareExistedHashData?: boolean
}

export interface GetDocumentsOps {
    mobileUid?: string
    documentTypes?: DocumentType[]
}
