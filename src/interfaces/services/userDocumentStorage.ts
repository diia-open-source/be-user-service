export type EncryptedDataByDocumentType = {
    [key in string]?: string[]
}

export type DecryptedDocument = Record<string, unknown> & { photo?: string; docPhoto?: string }

export type DecryptedDocuments = Record<string, DecryptedDocument[]>

export enum VaccinationCertificateType {
    Vaccination = 'vaccination',
    Test = 'test',
    Recovery = 'recovery',
}

export interface StoredMedicalData {
    id: string
    documentType: string
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
    documentTypes?: string[]
}
