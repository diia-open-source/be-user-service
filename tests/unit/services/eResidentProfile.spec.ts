import { AnalyticsActionResult } from '@diia-inhouse/analytics'
import DiiaLogger from '@diia-inhouse/diia-logger'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { Gender } from '@diia-inhouse/types'

const eresidentProfileModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    modelName: 'EResidentProfile',
}

jest.mock('@models/eResidentProfile', () => eresidentProfileModel)

import EResidentDeviceService from '@services/eResidentDevice'
import EResidentProfileService from '@services/eResidentProfile'

describe(`Service ${EResidentProfileService.name}`, () => {
    const now = new Date()
    const testKit = new TestKit()
    const loggerMock = mockInstance(DiiaLogger)
    const eResidentDeviceServiceMock = mockInstance(EResidentDeviceService)

    const eResidentProfileService = new EResidentProfileService(eResidentDeviceServiceMock, loggerMock)
    const headers = testKit.session.getHeaders()

    beforeEach(() => {
        jest.useFakeTimers({ now })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('method: `createOrUpdateProfile`', () => {
        it('should successfully update user profile', async () => {
            const userProfile = {
                identifier: 'identifier',
                gender: Gender.male,
                birthDay: new Date(),
            }

            jest.spyOn(eresidentProfileModel, 'findOne').mockResolvedValueOnce(userProfile)
            jest.spyOn(eResidentDeviceServiceMock, 'updateDevice').mockResolvedValueOnce()

            await eResidentProfileService.createOrUpdateProfile(userProfile, headers)

            expect(eresidentProfileModel.findOne).toHaveBeenCalledWith({ identifier: userProfile.identifier })
            expect(eResidentDeviceServiceMock.updateDevice).toHaveBeenCalledWith(userProfile.identifier, headers)
        })

        it('should successfully create user profile', async () => {
            const timezoneOffset = new Date().getTimezoneOffset() * 60000

            const userProfile = {
                identifier: 'identifier',
                gender: Gender.male,
                birthDay: new Date(),
            }

            jest.spyOn(eresidentProfileModel, 'findOne').mockResolvedValueOnce(undefined)
            jest.spyOn(eresidentProfileModel, 'create').mockResolvedValueOnce(true)
            jest.spyOn(eResidentDeviceServiceMock, 'updateDevice').mockResolvedValueOnce()

            await eResidentProfileService.createOrUpdateProfile(userProfile, headers)

            const dateOfBirth: Date = new Date(userProfile.birthDay.getTime() - timezoneOffset)

            expect(eresidentProfileModel.create).toHaveBeenCalledWith(userProfile)
            expect(eResidentDeviceServiceMock.updateDevice).toHaveBeenCalledWith(userProfile.identifier, headers)
            expect(loggerMock.info).toHaveBeenCalledWith('Analytics', {
                analytics: {
                    date: new Date().toISOString(),
                    category: 'eresidents',
                    action: {
                        type: 'addUser',
                        result: AnalyticsActionResult.Success,
                    },
                    identifier: userProfile.identifier,
                    appVersion: headers.appVersion,
                    device: {
                        identifier: headers.mobileUid,
                        platform: {
                            type: headers.platformType,
                            version: headers.platformVersion,
                        },
                    },
                    data: {
                        gender: userProfile.gender,
                        dayOfBirth: dateOfBirth.getDate(),
                        monthOfBirth: dateOfBirth.getMonth() + 1,
                        yearOfBirth: dateOfBirth.getFullYear(),
                    },
                },
            })
        })
    })
})
