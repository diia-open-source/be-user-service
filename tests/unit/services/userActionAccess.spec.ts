import { StoreService } from '@diia-inhouse/redis'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import UserActionAccessService from '@services/userActionAccess'
import UserActionAccessSettingService from '@services/userActionAccessSetting'

import { UserActionAccessSettingModel } from '@interfaces/models/userActionAccessSetting'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Service ${UserActionAccessService.name}`, () => {
    const testKit = new TestKit()
    const storeServiceMock = mockInstance(StoreService)
    const userActionAccessSettingServiceMock = mockInstance(UserActionAccessSettingService)
    const userActionAccessService = new UserActionAccessService(storeServiceMock, userActionAccessSettingServiceMock)
    const {
        user: { identifier: userIdentifier },
    } = testKit.session.getUserSession()
    const actionAccessType = ActionAccessType.AddBirthCertificate

    describe(`method ${userActionAccessService.hasActionAccess.name}`, () => {
        it.each([
            [true, '1'],
            [false, '10'],
            [true, null],
        ])('should return %s when userActionAccessCount = %s', async (expectedResult, userActionAccessCount) => {
            jest.spyOn(userActionAccessSettingServiceMock, 'getSetting').mockResolvedValueOnce(<UserActionAccessSettingModel>{
                maxValue: 5,
            })
            jest.spyOn(storeServiceMock, 'get').mockResolvedValueOnce(userActionAccessCount)

            expect(await userActionAccessService.hasActionAccess(userIdentifier, actionAccessType)).toBe(expectedResult)

            expect(userActionAccessSettingServiceMock.getSetting).toHaveBeenCalledWith(actionAccessType)
            expect(storeServiceMock.get).toHaveBeenCalledWith(`user-action-access:${userIdentifier}:${actionAccessType}`)
        })
    })

    describe(`method ${userActionAccessService.increaseCounterActionAccess.name}`, () => {
        it('should successfully increase counter action access', async () => {
            const userActionAccessCount = '1'

            jest.spyOn(userActionAccessSettingServiceMock, 'getSetting').mockResolvedValueOnce(<UserActionAccessSettingModel>{
                maxValue: 5,
                expirationTime: 60,
            })
            jest.spyOn(storeServiceMock, 'get').mockResolvedValueOnce(userActionAccessCount)
            jest.spyOn(storeServiceMock, 'set').mockResolvedValueOnce('OK')

            expect(await userActionAccessService.increaseCounterActionAccess(userIdentifier, actionAccessType)).toBeUndefined()

            expect(userActionAccessSettingServiceMock.getSetting).toHaveBeenCalledWith(actionAccessType)
            expect(storeServiceMock.get).toHaveBeenCalledWith(`user-action-access:${userIdentifier}:${actionAccessType}`)
            expect(storeServiceMock.set).toHaveBeenCalledWith(`user-action-access:${userIdentifier}:${actionAccessType}`, '2', {
                ttl: 60000,
            })
        })
    })

    describe(`method ${userActionAccessService.nullifyCounterActionAccess.name}`, () => {
        it('should successfully nullify counter action access', async () => {
            jest.spyOn(storeServiceMock, 'remove').mockResolvedValueOnce(1)

            expect(await userActionAccessService.nullifyCounterActionAccess(userIdentifier, actionAccessType)).toBeUndefined()

            expect(storeServiceMock.remove).toHaveBeenCalledWith(`user-action-access:${userIdentifier}:${actionAccessType}`)
        })
    })
})
