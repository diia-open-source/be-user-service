import { FileIntegrityResult, SignedFileHash } from '@interfaces/services/diiaId'

export interface DiiaIdHashFilesIntegrityRequest {
    identifier: string
    registryUserIdentifier: string
    certificateSerialNumber: string
    files: SignedFileHash[]
    returnOriginals?: boolean
}

export interface DiiaIdHashFilesIntegrityResponse {
    identifier: string
    checkResults: FileIntegrityResult[]
}
