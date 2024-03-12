import { DocumentDecryptedData } from '@diia-inhouse/crypto'
import { DocumentType, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        documentType: DocumentType
        dataToEncrypt: DocumentDecryptedData
        photoToEncrypt?: string
        docPhotoToEncrypt?: string
    }
}

export type ActionResult = void
