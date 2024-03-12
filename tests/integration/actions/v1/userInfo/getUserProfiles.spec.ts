import TestKit from '@diia-inhouse/test'

import GetUserProfilesAction from '@src/actions/v1/userInfo/getUserProfiles'

import userProfileModel from '@models/userProfile'

import { getUserProfile } from '@tests/mocks/services/userProfile'
import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/userInfo/getUserProfiles'

describe(`Action ${GetUserProfilesAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let action: GetUserProfilesAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()
        action = app.container.build(GetUserProfilesAction)
        testKit = app.container.resolve('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return found user profiles', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()

        const userProfile = getUserProfile()
        const userProfileAnother = getUserProfile()

        await userProfileModel.insertMany([userProfile, userProfileAnother])

        // Act
        const result = await action.handler({
            headers,
            params: {
                userIdentifiers: [userProfile.identifier, 'not-found-identifier'],
            },
        })

        // Assert
        expect(result).toEqual<ActionResult>({
            userProfiles: [
                {
                    identifier: userProfile.identifier,
                    gender: userProfile.gender,
                    birthDay: userProfile.birthDay,
                },
            ],
        })
    })
})
