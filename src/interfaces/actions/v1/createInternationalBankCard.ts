import { PartnerActionArguments } from '@diia-inhouse/types'

export interface CustomActionArguments extends PartnerActionArguments {
    params: {
        itn: string
        cardMask: string
        iban: string
    }
}
