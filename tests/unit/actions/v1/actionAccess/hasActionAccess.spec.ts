import TestKit, { mockInstance } from '@diia-inhouse/test'

import HasActionAccessAction from '@actions/v1/actionAccess/hasActionAccess'

import UserActionAccessService from '@services/userActionAccess'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Action ${HasActionAccessAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userActionAccessServiceMock = mockInstance(UserActionAccessService)

    const hasActionAccessAction = new HasActionAccessAction(userActionAccessServiceMock)

    describe('method `handler`', () => {
        it('should return true if user has action access', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', actionAccessType: ActionAccessType.AddBirthCertificate },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userActionAccessServiceMock, 'hasActionAccess').mockResolvedValueOnce(true)

            expect(await hasActionAccessAction.handler(args)).toBeTruthy()

            expect(userActionAccessServiceMock.hasActionAccess).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.actionAccessType,
            )
        })
    })
})
