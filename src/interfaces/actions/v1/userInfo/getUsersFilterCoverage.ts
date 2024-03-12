import { ServiceActionArguments } from '@diia-inhouse/types'

import { UserFilter, UserFilterCoverage } from '@interfaces/services/userProfile'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        filter: UserFilter
    }
}

export type ActionResult = UserFilterCoverage
