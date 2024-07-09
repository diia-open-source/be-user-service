import { UserActionArguments } from '@diia-inhouse/types'

import { InitDiiaIdHashesSigningRequest } from '@src/generated'

export interface CustomActionArguments extends UserActionArguments {
    params: InitDiiaIdHashesSigningRequest
}

export type ActionResult = void
