import { DocumentDecryptedData } from '@diia-inhouse/crypto'
import { ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        documentType: string
        dataToEncrypt: DocumentDecryptedData
        photoToEncrypt?: string
        docPhotoToEncrypt?: string
    }
}

export type ActionResult = void
