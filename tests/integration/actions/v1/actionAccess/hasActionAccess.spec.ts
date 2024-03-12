import { StoreService } from '@diia-inhouse/redis'
import TestKit from '@diia-inhouse/test/*'

import HasActionAccessAction from '@src/actions/v1/actionAccess/hasActionAccess'

import UserActionAccessSettingService from '@services/userActionAccessSetting'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/actionAccess/hasActionAccess'
import { UserActionAccessSettingModel } from '@interfaces/models/userActionAccessSetting'
import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Action ${HasActionAccessAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let hasActionAccessAction: HasActionAccessAction
    let userActionAccessSettingService: UserActionAccessSettingService
    let store: StoreService
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()
        hasActionAccessAction = app.container.build(HasActionAccessAction)
        userActionAccessSettingService = app.container.resolve<UserActionAccessSettingService>('userActionAccessSettingService')
        store = app.container.resolve('store')!
        testKit = app.container.resolve<TestKit>('testKit')
        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return true when maxValue > currentCount', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        jest.spyOn(userActionAccessSettingService, 'getSetting').mockImplementationOnce(
            async () => <UserActionAccessSettingModel>{ actionAccessType: ActionAccessType.AddBirthCertificate, maxValue: 10 },
        )

        jest.spyOn(store, 'get').mockImplementationOnce(async () => '0')

        // Act
        const result = await hasActionAccessAction.handler({
            headers,
            params: { userIdentifier, actionAccessType: ActionAccessType.AddBirthCertificate },
        })

        // Assert
        expect(result).toBe<ActionResult>(true)
    })

    it('should return false when maxValue < currentCount', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        jest.spyOn(userActionAccessSettingService, 'getSetting').mockImplementationOnce(
            async () => <UserActionAccessSettingModel>{ actionAccessType: ActionAccessType.AddBirthCertificate, maxValue: 10 },
        )

        jest.spyOn(store, 'get').mockImplementationOnce(async () => '100')

        // Act
        const result = await hasActionAccessAction.handler({
            headers,
            params: { userIdentifier, actionAccessType: ActionAccessType.AddBirthCertificate },
        })

        // Assert
        expect(result).toBe<ActionResult>(false)
    })
})
