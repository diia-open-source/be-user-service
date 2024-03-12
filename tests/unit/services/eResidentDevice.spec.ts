import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'

const eResidentDeviceModel = {
    updateOne: jest.fn(),
    modelName: 'EResidentDevice',
}

jest.mock('@models/eResidentDevice', () => eResidentDeviceModel)

import EResidentDeviceService from '@services/eResidentDevice'

describe(`Service ${EResidentDeviceService.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const loggerMock = mockInstance(DiiaLogger)

    const eResidentDeviceService = new EResidentDeviceService(loggerMock)
    const userIdentifier = 'userIdentifier'
    const headers = testKit.session.getHeaders()

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('method: `updateDevice`', () => {
        it('should successfully update device', async () => {
            jest.spyOn(eResidentDeviceModel, 'updateOne').mockResolvedValueOnce(true)

            await eResidentDeviceService.updateDevice(userIdentifier, headers)

            expect(eResidentDeviceModel.updateOne).toHaveBeenCalledWith(
                { mobileUid: headers.mobileUid },
                {
                    $set: { platformVersion: headers.platformVersion, userIdentifier },
                    $setOnInsert: { mobileUid: headers.mobileUid, platformType: headers.platformType },
                },
                { upsert: true },
            )
        })
    })

    describe('method: `unassignDevice`', () => {
        it('should successfully unassign device', async () => {
            jest.spyOn(eResidentDeviceModel, 'updateOne').mockResolvedValueOnce({ modifiedCount: 1 })

            await eResidentDeviceService.unassignDevice(headers.mobileUid, userIdentifier)

            expect(eResidentDeviceModel.updateOne).toHaveBeenCalledWith(
                { mobileUid: headers.mobileUid, userIdentifier },
                { $unset: { userIdentifier: 1 } },
            )
            expect(loggerMock.info).toHaveBeenCalledWith('Successfully unassign device from user', {
                mobileUid: headers.mobileUid,
                userIdentifier,
            })
            expect(loggerMock.info).toHaveBeenCalledWith('Analytics', {
                analytics: {
                    date: new Date().toISOString(),
                    category: 'eresidents',
                    action: {
                        type: 'removeDevice',
                        result: 'success',
                    },
                    identifier: userIdentifier,
                    device: {
                        identifier: headers.mobileUid,
                    },
                },
            })
        })

        it('should fail to unassign device', async () => {
            jest.spyOn(eResidentDeviceModel, 'updateOne').mockResolvedValueOnce({ modifiedCount: 0 })

            await eResidentDeviceService.unassignDevice(headers.mobileUid, userIdentifier)

            expect(loggerMock.error).toHaveBeenCalledWith('Failed to unassign device from user', {
                mobileUid: headers.mobileUid,
                userIdentifier,
            })
        })
    })
})
