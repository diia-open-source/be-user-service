import { ServiceActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        mobileUidToFilter: string
    }
}

export type ActionResult = boolean
