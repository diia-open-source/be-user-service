import { Gender, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        phoneNumber: string
        gender: Gender
        birthDay: string
    }
}

export interface ActionResult {
    itn: string
}
