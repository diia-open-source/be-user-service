import { AppUserActionArguments } from '@diia-inhouse/types'

import { SignAlgo } from '@interfaces/models/diiaId'
import { ProcessCode } from '@interfaces/services'
import { DiiaIdIdentifier } from '@interfaces/services/diiaId'

export type CustomActionArguments = AppUserActionArguments & {
    params: {
        processId: string
        signAlgo: SignAlgo[]
    }
}

export interface ActionResult {
    identifiers: DiiaIdIdentifier[]
    processCode: ProcessCode
}
