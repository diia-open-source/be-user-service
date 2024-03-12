import { UserActionArguments } from '@diia-inhouse/types'

import { DiiaIdSignType } from '@interfaces/externalEventListeners/diiaIdSignHashesInit'
import { SignAlgo } from '@interfaces/models/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        signAlgo: SignAlgo
        signType: DiiaIdSignType
        noSigningTime?: boolean
        noContentTimestamp?: boolean
    }
}

export interface ActionResult {
    success: boolean
}
