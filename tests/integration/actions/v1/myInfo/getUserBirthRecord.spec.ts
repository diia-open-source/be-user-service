import TestKit from '@diia-inhouse/test'

import GetUserBirthRecordAction from '@src/actions/v1/myInfo/getUserBirthRecord'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/myInfo/getUserBirthRecord'
import { ProcessCode } from '@interfaces/services'

describe(`Action ${GetUserBirthRecordAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getUserBirthRecordAction: GetUserBirthRecordAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        getUserBirthRecordAction = app.container.build(GetUserBirthRecordAction)
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return process code when itn invalid', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        // Act
        const result = await getUserBirthRecordAction.handler({ session, headers, params: {} })

        // Assert
        expect(result).toEqual<ActionResult>({ processCode: ProcessCode.InvalidItn })
    })
})
