import { ServiceActionArguments } from '@diia-inhouse/types'

import { CitizenshipSource } from '@interfaces/models/userProfile'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        source: CitizenshipSource
        sourceId: string
    }
}

export interface ActionResult {
    success: boolean
}
