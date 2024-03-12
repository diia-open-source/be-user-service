import TestKit, { mockInstance } from '@diia-inhouse/test'
import { Gender } from '@diia-inhouse/types'

import GetCabinetUserInfoAction from '@actions/v1/userInfo/getCabinetUserInfo'

import UserProfileService from '@services/userProfile'

describe(`Action ${GetCabinetUserInfoAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const getCabinetUserInfoAction = new GetCabinetUserInfoAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return cabinet user info', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers,
            }

            const cabinetUserInfo = {
                itn: testKit.session.generateItn(testKit.session.getBirthDate(), testKit.session.getGender(), false),
                edrpou: 'edrpou',
                fName: 'fName',
                lName: 'lName',
                mName: 'mName',
                gender: Gender.female,
                birthDay: '01.01.1990',
                phoneNumber: 'phoneNumber',
                email: 'email',
            }

            jest.spyOn(userProfileServiceMock, 'getCabinetUserInfo').mockReturnValueOnce(cabinetUserInfo)

            expect(await getCabinetUserInfoAction.handler(args)).toMatchObject(cabinetUserInfo)

            expect(userProfileServiceMock.getCabinetUserInfo).toHaveBeenCalledWith(args.session.user)
        })
    })
})
