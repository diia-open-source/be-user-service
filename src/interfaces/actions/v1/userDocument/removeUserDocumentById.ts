import { ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        documentType: string
        documentId: string
        mobileUid: string
    }
}

export type ActionResult = void
