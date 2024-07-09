import TestKit, { mockInstance } from '@diia-inhouse/test'

import IsUkrainianCitizenAction from '@actions/v1/isUkrainianCitizen'

import UserDocumentService from '@services/userDocument'
import UserProfileService from '@services/userProfile'

import { CitizenshipSource, UserProfileCitizenship } from '@interfaces/models/userProfile'

describe(`Action ${IsUkrainianCitizenAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentServiceMock = mockInstance(UserDocumentService)
    const userProfileServiceMock = mockInstance(UserProfileService)

    const isUkrainianCitizenAction = new IsUkrainianCitizenAction(userDocumentServiceMock, userProfileServiceMock)

    describe('method `handler`', () => {
        it('should return true if user has one of documents', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentServiceMock, 'hasOneOfDocuments').mockResolvedValueOnce(true)

            expect(await isUkrainianCitizenAction.handler(args)).toBeTruthy()

            expect(userDocumentServiceMock.hasOneOfDocuments).toHaveBeenCalledWith(args.params.userIdentifier, [
                'internal-passport',
                'foreign-passport',
            ])
        })

        it('should return true if user has ukrainian citizenship', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const userProfileCitizenship = <UserProfileCitizenship>{ country: 'Ukraine' }

            jest.spyOn(userDocumentServiceMock, 'hasOneOfDocuments').mockResolvedValueOnce(false)
            jest.spyOn(userProfileServiceMock, 'getUserCitizenship').mockResolvedValueOnce(userProfileCitizenship)

            expect(await isUkrainianCitizenAction.handler(args)).toBeTruthy()

            expect(userDocumentServiceMock.hasOneOfDocuments).toHaveBeenCalledWith(args.params.userIdentifier, [
                'internal-passport',
                'foreign-passport',
            ])
            expect(userProfileServiceMock.getUserCitizenship).toHaveBeenCalledWith(
                args.params.userIdentifier,
                CitizenshipSource.BankAccount,
            )
        })
    })
})
