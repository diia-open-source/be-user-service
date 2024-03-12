import { SignAlgo } from '@interfaces/models/diiaId'

export interface FileToHash {
    name: string
    file: string
    isRequireInternalSign?: boolean
}

export interface DiiaIdHashFilesRequest {
    identifier: string
    registryUserIdentifier: string
    certificateSerialNumber: string
    files: FileToHash[]
    signAlgo: SignAlgo
}

export interface HashedFile {
    name: string
    hash: string
}

export interface DiiaIdHashFilesResponse {
    identifier: string
    hashes: HashedFile[]
}
