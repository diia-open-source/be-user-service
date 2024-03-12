import { DocStatus, DocumentType, DocumentTypeCamelCase, OwnerType, UserDocumentSubtype } from '@diia-inhouse/types'

import { DocumentItem } from '@src/generated'

export interface VehicleLicenseUserDocumentData {
    brand: string
    model: string
    licensePlate: string
}

export type UserDocumentData = VehicleLicenseUserDocumentData

export interface ComparedTo {
    documentType: DocumentType
    fullNameHash: string
}

export enum IdentityDocumentType {
    InternalPassport = 'internal-passport',
    ForeignPassport = 'foreign-passport',
    ResidencePermitPermanent = 'residence-permit-permanent',
    ResidencePermitTemporary = 'residence-permit-temporary',
    EResidentPassport = 'e-resident-passport',
}

export interface UserProfileDocument {
    documentIdentifier: string
    documentSubType?: UserDocumentSubtype | string
    normalizedDocumentIdentifier?: string
    ownerType: OwnerType
    docId?: string
    fullNameHash?: string
    docStatus?: DocStatus
    compoundDocument?: UserCompoundDocument
    registrationDate?: Date
    issueDate?: Date
    expirationDate?: Date
    comparedTo?: ComparedTo
    documentData?: UserDocumentData
}

export interface UserCompoundDocument {
    documentType: DocumentType
    documentIdentifier: string
}

export enum PassportType {
    ID = 'ID',
    P = 'P',
}

export interface Passport {
    docNumber: string
    lastNameUA: string
    firstNameUA: string
    middleNameUA: string
    photo: string
    sign: string
    countryCode: string
    recordNumber: string
    type: PassportType
}

export interface IdentityDocument {
    identityType: IdentityDocumentType
    docNumber: string
    lastNameUA: string
    firstNameUA: string
    middleNameUA?: string
    firstNameEN: string
    lastNameEN: string
    photo: string
    sign: string
    recordNumber: string
    residenceCityUA?: string
    residenceCityEN?: string
    residenceCountryCodeAlpha2?: string
}

export interface BirthCertificate {
    id: string
}

export interface GetDocumentsRequest {
    documents?: DocumentWithETagRequest[]
}

export interface DocumentWithETagRequest {
    type: DocumentTypeCamelCase
    eTag?: string
}

export type DocumentsResponse = Partial<Record<DocumentTypeCamelCase, DocumentItem>>
