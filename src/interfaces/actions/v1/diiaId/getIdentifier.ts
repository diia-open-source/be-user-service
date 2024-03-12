import { UserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'
import { DiiaIdResponse } from '@interfaces/services/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    diiaId?: DiiaIdResponse
}
