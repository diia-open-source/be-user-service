import { UpdateWriteOpResult } from '@diia-inhouse/db'
import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import UserDeviceService from '@services/userDevice'

import userDeviceModel from '@models/userDevice'

describe(`Service ${UserDeviceService.name}`, () => {
    const testKit = new TestKit()
    const loggerMock = mockInstance(DiiaLogger)
    const userDeviceService = new UserDeviceService(loggerMock)
    const headers = testKit.session.getHeaders()
    const {
        user: { identifier: userIdentifier },
    } = testKit.session.getUserSession()
    const { mobileUid, platformVersion, platformType } = headers
    const now = new Date()

    beforeAll(() => {
        jest.useFakeTimers({ now })
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe(`method ${userDeviceService.updateDevice.name}`, () => {
        it('should successfully update user device', async () => {
            jest.spyOn(userDeviceModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 1 })

            expect(await userDeviceService.updateDevice(userIdentifier, headers)).toBeUndefined()

            expect(userDeviceModel.updateOne).toHaveBeenCalledWith(
                { mobileUid },
                {
                    $set: { platformVersion, userIdentifier },
                    $setOnInsert: { mobileUid, platformType },
                },
                { upsert: true },
            )
        })
    })

    describe(`method ${userDeviceService.unassignDevice.name}`, () => {
        it('should successfully unassign user device and write analytics about that', async () => {
            jest.spyOn(userDeviceModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 1 })

            expect(await userDeviceService.unassignDevice(mobileUid, userIdentifier)).toBeUndefined()

            expect(userDeviceModel.updateOne).toHaveBeenCalledWith({ mobileUid, userIdentifier }, { $unset: { userIdentifier: 1 } })
            expect(loggerMock.info).toHaveBeenCalledWith('Successfully unassign device from user', { mobileUid, userIdentifier })
            expect(loggerMock.info).toHaveBeenCalledWith('Analytics', {
                analytics: {
                    date: now.toISOString(),
                    category: 'users',
                    action: {
                        type: 'removeDevice',
                        result: 'success',
                    },
                    identifier: userIdentifier,
                    device: {
                        identifier: mobileUid,
                    },
                },
            })
        })

        it('should not unassign user device', async () => {
            jest.spyOn(userDeviceModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 0 })

            expect(await userDeviceService.unassignDevice(mobileUid, userIdentifier)).toBeUndefined()

            expect(userDeviceModel.updateOne).toHaveBeenCalledWith({ mobileUid, userIdentifier }, { $unset: { userIdentifier: 1 } })
            expect(loggerMock.error).toHaveBeenCalledWith('Failed to unassign device from user', { mobileUid, userIdentifier })
        })
    })
})
