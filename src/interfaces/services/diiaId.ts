import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { DiiaIdModel, SignAlgo } from '@interfaces/models/diiaId'
import { AttentionMessage } from '@interfaces/services'
import { IdentityDocumentType } from '@interfaces/services/documents'

export interface FileIntegrityResult {
    name: string
    checked: boolean
    originalFileBase64?: string
}

export interface DiiaIdResponse {
    identifier: string
    creationDate: string
    expirationDate: string
    passport: {
        docNumber: string
        lastNameUA: string
        firstNameUA: string
        middleNameUA: string
        photo: string
        sign: string
    }
}

export interface DiiaIdIdentifierResponse {
    identifier?: string
    description?: string
    attentionMessage?: AttentionMessage
    hasSigningHistory: boolean
    stubMessage?: {
        icon?: string
        text: string
    }
}

export interface DiiaIdIdentifiersResponseV1 {
    identifiers: DiiaIdIdentifier[]
    description?: string
    attentionMessage?: AttentionMessage
    hasSigningHistory: boolean
    stubMessage?: {
        icon?: string
        text: string
    }
}

export interface DiiaIdIdentifiersResponse {
    identifiers: DiiaIdIdentifier[]
    description?: string
    attentionMessage?: AttentionMessage
    buttonHistoryName: string
}

export enum DiiaIdCertificateCountryCode {
    Ua = 'UA',
}

export interface DiiaIdCertificateUserInfo {
    countryCode: DiiaIdCertificateCountryCode | string
    rnokpp: string
    lastName: string
    firstName: string
    middleName: string
    unzr: string
    location?: string
}

export interface DiiaIdCertificateFiles {
    agreement: string
    passport: string
}

export interface DiiaIdCreateCertificateMessage {
    identifier: string
    userInfo: DiiaIdCertificateUserInfo
    signAlgo: SignAlgo
    files: DiiaIdCertificateFiles
}

export interface DiiaIdCreateCertificateResponse {
    certificateSerialNumber: string
    registryUserIdentifier: string
    identifier: string
    creationDate: Date
    expirationDate: Date
    signAlgo: SignAlgo
}

export interface DiiaIdRenewCertificateResponse {
    identifier: string
    creationDate: Date
    expirationDate: Date
}

export interface SignedFile {
    name: string
    data: string
    signature: string
}

export interface SignedFileHash {
    name: string
    hash: string
    signature: string
}

export interface AreSignedFileHashesValidParams {
    userIdentifier: string
    mobileUid: string
    files: SignedFileHash[]
    validateDiiaIdAction?: boolean
    returnOriginals?: boolean
    signAlgo: SignAlgo
}

export interface InitHashesSigningParams {
    userIdentifier: string
    mobileUid: string
    signAlgo: SignAlgo
    signType?: DiiaIdSignType
    noSigningTime?: boolean
    noContentTimestamp?: boolean
    processId?: string
    diiaId?: DiiaIdModel
}

export interface AreSignedFileHashesValidResult {
    areValid: boolean
    checkResults: FileIntegrityResult[]
}

export interface DiiaIdAgreementGenerationData {
    identityType?: IdentityDocumentType
    docNumber: string
    sign: string
    lastName: string
    firstName: string
    middleName: string
}

export interface EResidentDiiaIdAgreementGenerationData extends DiiaIdAgreementGenerationData {
    lastNameUA: string
    firstNameUA: string
    middleNameUA: string
}

export interface DiiaIdIdentifier {
    identifier: string
    signAlgo: SignAlgo
}

export interface HashFilesToSignOptions {
    signType?: DiiaIdSignType
    noSigningTime?: boolean
    noContentTimestamp?: boolean
}
