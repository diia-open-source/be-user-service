import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetUserInfoAction from '@actions/v1/userInfo/getUserInfo'

import UserProfileService from '@services/userProfile'

describe(`Action ${GetUserInfoAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const getUserInfoAction = new GetUserInfoAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return user info', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers,
            }

            const userInfo = {
                attentionMessage: {
                    text: 'Дія не зберігає ваші дані.',
                    icon: '☝️',
                },
                text: 'text',
                phoneNumber: 'phoneNumber',
                email: 'email',
            }

            jest.spyOn(userProfileServiceMock, 'getUserInfo').mockReturnValueOnce(userInfo)

            expect(await getUserInfoAction.handler(args)).toMatchObject(userInfo)

            expect(userProfileServiceMock.getUserInfo).toHaveBeenCalledWith(args.session.user)
        })
    })
})
