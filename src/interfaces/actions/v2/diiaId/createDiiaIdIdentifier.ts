import { AppUserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'

export type CustomActionArguments = AppUserActionArguments & {
    params: {
        processId: string
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    identifier: string
    processCode: ProcessCode
}
