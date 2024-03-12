import { UserActionArguments } from '@diia-inhouse/types'

import { TaxReportDao } from '@interfaces/externalEventListeners/diiaIdSignDpsPackagePrepare'
import { SignAlgo } from '@interfaces/models/diiaId'

export interface CustomActionArguments extends UserActionArguments {
    params: {
        signAlgo: SignAlgo
    }
}

export interface ActionResult {
    taxPackage: TaxReportDao[]
}
