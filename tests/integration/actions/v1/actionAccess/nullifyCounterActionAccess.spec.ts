import { StoreService } from '@diia-inhouse/redis'
import TestKit from '@diia-inhouse/test'

import NullifyCounterActionAccessAction from '@src/actions/v1/actionAccess/nullifyCounterActionAccess'

import { getApp } from '@tests/utils/getApp'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Action ${NullifyCounterActionAccessAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let nullifyCounterActionAccessAction: NullifyCounterActionAccessAction
    let store: StoreService
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        nullifyCounterActionAccessAction = app.container.build(NullifyCounterActionAccessAction)
        store = app.container.resolve<StoreService>('store')!
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should nullify value', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const userIdentifier = session.user.identifier

        jest.spyOn(store, 'get').mockImplementationOnce(async () => '42')

        const setSpy = jest.spyOn(store, 'remove')

        // Act
        await nullifyCounterActionAccessAction.handler({
            headers,
            params: { userIdentifier, actionAccessType: ActionAccessType.AddBirthCertificate },
        })

        // Assert
        expect(setSpy).toHaveBeenCalled()
    })
})
