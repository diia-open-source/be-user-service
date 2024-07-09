import { ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier?: string
        documentType: string
        documentIdentifier: string
        photo: string
    }
}

export interface ActionResult {
    points: number[]
}
