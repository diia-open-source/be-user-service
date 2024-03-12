import { UserActionArguments } from '@diia-inhouse/types'

import { DiiaIdIdentifier } from '@interfaces/services/diiaId'

export type CustomActionArguments = UserActionArguments

export interface ActionResult {
    identifiers: DiiaIdIdentifier[]
}
