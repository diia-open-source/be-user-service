import { UserActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        phoneNumber: string
    }
}

export interface ActionResult {
    success: boolean
}
