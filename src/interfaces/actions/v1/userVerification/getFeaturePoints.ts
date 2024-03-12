import { ServiceActionArguments } from '@diia-inhouse/types'

import { GetPointsResult } from '@interfaces/services/documentFeaturePoints'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
    }
}

export interface ActionResult {
    points: GetPointsResult[]
}
