import { Gender, ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        identifier: string
        gender: Gender
        birthDay: string
    }
}
