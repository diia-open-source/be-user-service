import { UserActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        documentType: string
        documentId: string
    }
}

export interface ActionResult {
    success: boolean
}
