import { EventBusListener, ScheduledTaskEvent } from '@diia-inhouse/diia-queue'
import { Logger } from '@diia-inhouse/types'

import UserDocumentService from '@services/userDocument'

export default class CheckVehicleLicensesExpirationsTask implements EventBusListener {
    constructor(
        private readonly userDocumentService: UserDocumentService,
        private readonly logger: Logger,
    ) {}

    readonly event: ScheduledTaskEvent = ScheduledTaskEvent.UserCheckVehicleLicensesExpirations

    async handler(): Promise<void> {
        this.logger.info('Start checking vehicle licenses expirations for notifications')

        await this.userDocumentService.checkVehicleLicensesExpirations()
    }
}
