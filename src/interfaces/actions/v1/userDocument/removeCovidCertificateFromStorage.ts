import { ServiceActionArguments } from '@diia-inhouse/types'

import { VaccinationCertificateType } from '@interfaces/services/userDocumentStorage'

export interface CustomActionArguments extends ServiceActionArguments {
    params: {
        userIdentifier: string
        mobileUid: string
        documentType: string
        types: VaccinationCertificateType[]
        birthCertificateId?: string
    }
}

export type ActionResult = void
