import { randomUUID as uuid } from 'node:crypto'

import { ExternalCommunicator, ExternalEvent, ExternalEventBus } from '@diia-inhouse/diia-queue'
import { ServiceUnavailableError } from '@diia-inhouse/errors'
import { Logger } from '@diia-inhouse/types'

import { DiiaIdCertificateInfoResponse } from '@interfaces/externalEventListeners/diiaIdCertificateInfo'
import { EResidentDiiaIdInfoRequest } from '@interfaces/services/eResidentDiiaIdConfirmation'

export default class EResidentDiiaIdConfirmationService {
    constructor(
        private readonly externalEventBus: ExternalEventBus,
        private readonly external: ExternalCommunicator,
        private readonly logger: Logger,
    ) {}

    async confirmEresidentCreation(request: EResidentDiiaIdInfoRequest): Promise<void> {
        const response = await this.external.receive<DiiaIdCertificateInfoResponse>(ExternalEvent.DiiaIdCertificateInfo, request)
        if (!response) {
            throw new ServiceUnavailableError('No external response')
        }

        const { subjDRFOCode } = response
        const messageUid = uuid()

        await this.externalEventBus.publish(ExternalEvent.EResidentDiiaIdCreation, {
            uuid: messageUid,
            request: {
                itn: subjDRFOCode,
            },
        })

        this.logger.info('EResident: confirmed diiaId creation', { messageUid })
    }
}
