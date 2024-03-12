import { UserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    identifier?: string
}
