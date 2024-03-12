import { UserActionArguments } from '@diia-inhouse/types'

import { ProcessCode } from '@interfaces/services'

export type CustomActionArguments = UserActionArguments

export interface ActionResult {
    success: boolean
    processCode: ProcessCode
}
