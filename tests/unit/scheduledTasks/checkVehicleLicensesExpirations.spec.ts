import Logger from '@diia-inhouse/diia-logger'
import { ScheduledTaskEvent } from '@diia-inhouse/diia-queue'
import { mockInstance } from '@diia-inhouse/test'

import CheckVehicleLicensesExpirationsTask from '@src/scheduledTasks/checkVehicleLicensesExpirations'

import UserDocumentService from '@services/userDocument'

describe(`Scheduled Task ${CheckVehicleLicensesExpirationsTask.name}`, () => {
    const logger = mockInstance(Logger)
    const userDocumentService = mockInstance(UserDocumentService)
    const scheduledTask = new CheckVehicleLicensesExpirationsTask(userDocumentService, logger)

    it('should call userDocumentService.checkVehicleLicensesExpirations', async () => {
        await scheduledTask.handler()

        expect(scheduledTask.event).toBe(ScheduledTaskEvent.UserCheckVehicleLicensesExpirations)
        expect(logger.info).toHaveBeenCalledWith('Start checking vehicle licenses expirations for notifications')
        expect(userDocumentService.checkVehicleLicensesExpirations).toHaveBeenCalled()
    })
})
