import DiiaLogger from '@diia-inhouse/diia-logger'
import { ExternalCommunicator, ExternalEvent, ExternalEventBus } from '@diia-inhouse/diia-queue'
import { mockInstance } from '@diia-inhouse/test'

import EResidentDiiaIdConfirmationService from '@services/eResidentDiiaIdConfirmation'

describe(`Service ${EResidentDiiaIdConfirmationService.name}`, () => {
    const externalEventBusMock = mockInstance(ExternalEventBus)
    const extrenalCommunicatorMock = mockInstance(ExternalCommunicator)
    const loggerMock = mockInstance(DiiaLogger)

    const eResidentDiiaIdConfirmationService = new EResidentDiiaIdConfirmationService(
        externalEventBusMock,
        extrenalCommunicatorMock,
        loggerMock,
    )

    describe('method: `confirmEresidentCreation`', () => {
        it('should successfully confirm e-resident creation', async () => {
            const subjDRFOCode = 'subjDRFOCode'
            const request = {
                certificateSerialNumber: 'certificateSerialNumber',
                registryUserIdentifier: 'registryUserIdentifier',
            }

            jest.spyOn(extrenalCommunicatorMock, 'receive').mockResolvedValueOnce({ subjDRFOCode })
            jest.spyOn(externalEventBusMock, 'publish').mockResolvedValueOnce(true)

            await eResidentDiiaIdConfirmationService.confirmEresidentCreation(request)

            expect(extrenalCommunicatorMock.receive).toHaveBeenCalledWith(ExternalEvent.DiiaIdCertificateInfo, request)
            expect(externalEventBusMock.publish).toHaveBeenCalledWith(ExternalEvent.EResidentDiiaIdCreation, {
                uuid: expect.any(String),
                request: {
                    itn: subjDRFOCode,
                },
            })
        })
    })
})
