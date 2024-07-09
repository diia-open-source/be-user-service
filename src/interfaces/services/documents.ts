import { DocStatus, OwnerType } from '@diia-inhouse/types'

export enum UserDocumentSubtype {
    Permanent = 'permanent',
    IssuedFirst = 'issuedFirst',
    Recovery = 'recovery',
    Vaccination = 'vaccination',
    Test = 'test',
    Pupil = 'pupil',
    Student = 'student',
}

export interface VehicleLicenseUserDocumentData {
    brand: string
    model: string
    licensePlate: string
}

export type UserDocumentData = VehicleLicenseUserDocumentData

export interface ComparedTo {
    documentType: string
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
    documentType: string
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
