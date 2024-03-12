import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType, Gender } from '@diia-inhouse/types'

import GetUsersFilterCoveragesAction from '@actions/v1/userInfo/getUsersFilterCoverage'

import UserProfileService from '@services/userProfile'

describe(`Action ${GetUsersFilterCoveragesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userProfileServiceMock = mockInstance(UserProfileService)

    const getUsersFilterCoveragesAction = new GetUsersFilterCoveragesAction(userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return user filter coverage', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    features: [],
                    filter: {
                        gender: Gender.female,
                        childrenAmount: 2,
                        age: {
                            from: 25,
                            to: 40,
                        },
                        address: {
                            regionId: 'region123',
                            atuId: 'atu123',
                        },
                        documents: [
                            {
                                type: DocumentType.InternalPassport,
                            },
                            {
                                type: DocumentType.DriverLicense,
                            },
                        ],
                    },
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userProfileServiceMock, 'getFilterCoverage').mockResolvedValueOnce({ percent: 10 })

            expect(await getUsersFilterCoveragesAction.handler(args)).toMatchObject({ percent: 10 })

            expect(userProfileServiceMock.getFilterCoverage).toHaveBeenCalledWith(args.params.filter)
        })
    })
})
