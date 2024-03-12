import { StoreService } from '@diia-inhouse/redis'
import TestKit from '@diia-inhouse/test'

import IncreaseCounterActionAccessAction from '@src/actions/v1/actionAccess/increaseCounterActionAccess'

import { getApp } from '@tests/utils/getApp'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Action ${IncreaseCounterActionAccessAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let increaseCounterActionAccessAction: IncreaseCounterActionAccessAction
    let store: StoreService
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        increaseCounterActionAccessAction = app.container.build(IncreaseCounterActionAccessAction)
        store = app.container.resolve<StoreService>('store')!
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should set 1 as init value', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        jest.spyOn(store, 'get').mockImplementation(async () => '')

        const setSpy = jest.spyOn(store, 'set')

        // Act
        await increaseCounterActionAccessAction.handler({
            headers,
            params: { userIdentifier, actionAccessType: ActionAccessType.AddBirthCertificate },
        })

        // Assert
        const passedValue = setSpy.mock.lastCall?.at(1)

        expect(passedValue).toBe('1')
    })

    it('should incerement current value', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        jest.spyOn(store, 'get').mockImplementation(async () => '42')

        const setSpy = jest.spyOn(store, 'set')

        // Act
        await increaseCounterActionAccessAction.handler({
            headers,
            params: { userIdentifier, actionAccessType: ActionAccessType.AddBirthCertificate },
        })

        // Assert
        const passedValue = setSpy.mock.lastCall?.at(1)

        expect(passedValue).toBe('43')
    })
})
