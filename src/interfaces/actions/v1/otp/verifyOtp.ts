import { UserActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        otp: number
    }
}

export interface ActionResult {
    success: boolean
}
