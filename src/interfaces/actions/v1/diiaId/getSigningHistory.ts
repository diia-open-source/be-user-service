import { UserActionArguments } from '@diia-inhouse/types'

// import { SigningRequest } from '@interfaces/models/diiaIdSigningRequest';

export interface CustomActionArguments extends UserActionArguments {
    params: {
        skip?: number
        limit?: number
    }
}

export interface ActionResult {
    signingRequests: unknown[]
    total: number
}
