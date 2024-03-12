import { ServiceActionArguments } from '@diia-inhouse/types'

import { CheckPointsResult } from '@interfaces/services/documentFeaturePoints'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
    }
}

export interface ActionResult {
    documents: CheckPointsResult[]
}
