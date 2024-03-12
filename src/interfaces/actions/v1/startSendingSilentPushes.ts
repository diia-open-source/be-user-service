import { ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        actionType: string
    }
}

export interface ActionResult {
    success: boolean
}
