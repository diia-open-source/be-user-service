import { FileToHash, HashedFile } from '@interfaces/externalEventListeners/diiaIdHashFiles'
import { SignAlgo } from '@interfaces/models/diiaId'

export interface DiiaIdHashFileRequest {
    processId: string
    file: FileToHash
    signAlgo: SignAlgo
}

export interface DiiaIdHashFileResponse {
    processId: string
    hash: HashedFile
}
