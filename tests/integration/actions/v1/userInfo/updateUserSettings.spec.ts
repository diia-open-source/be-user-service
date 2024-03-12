import TestKit from '@diia-inhouse/test'

import UpdateUserSettingsAction from '@src/actions/v1/userInfo/updateUserSettings'

import userProfileModel from '@models/userProfile'

import { getApp } from '@tests/utils/getApp'

describe(`Action ${UpdateUserSettingsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let updateUserSettingsAction: UpdateUserSettingsAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        updateUserSettingsAction = app.container.build(UpdateUserSettingsAction)
        testKit = app.container.resolve('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it.each([true, undefined, false])(`should update setting model when received key with %s value`, async (value) => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()
        const { identifier: userIdentifier } = session.user

        // Act
        const result = await updateUserSettingsAction.handler({
            session,
            headers,
            params: {
                myInfoUsePassportPhoto: value,
            },
        })

        // Assert
        const userProfile = await userProfileModel.findOne({ identifier: userIdentifier })

        expect(result).toBeUndefined()
        expect(userProfile?.settings?.myInfoUsePassportPhoto).toBe(value)
    })

    it('should not update setting model when key not received', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()
        const { identifier: userIdentifier } = session.user

        // Act
        const result = await updateUserSettingsAction.handler({
            session,
            headers,
            params: {},
        })

        // Assert
        const userProfile = await userProfileModel.findOne({ identifier: userIdentifier })

        expect(result).toBeUndefined()
        expect(userProfile?.settings?.myInfoUsePassportPhoto).toBeUndefined()
    })
})
