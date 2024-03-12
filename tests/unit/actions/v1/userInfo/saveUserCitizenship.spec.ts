import TestKit, { mockInstance } from '@diia-inhouse/test'

import SaveUserCitizenshipAction from '@actions/v1/userInfo/saveUserCitizenship'

import UserProfileService from '@services/userProfile'

import { CitizenshipSource } from '@interfaces/models/userProfile'

describe(`Action ${SaveUserCitizenshipAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const saveUserCitizenshipAction = new SaveUserCitizenshipAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return true if updated user citizenship', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    source: CitizenshipSource.BankAccount,
                    sourceId: 'sourceId',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userProfileServiceMock, 'updateUserCitizenship').mockResolvedValueOnce()

            expect(await saveUserCitizenshipAction.handler(args)).toMatchObject({ success: true })

            expect(userProfileServiceMock.updateUserCitizenship).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.source,
                args.params.sourceId,
            )
        })
    })
})
