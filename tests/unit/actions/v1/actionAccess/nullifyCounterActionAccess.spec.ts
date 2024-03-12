import TestKit, { mockInstance } from '@diia-inhouse/test'

import NullifyCounterActionAccessAction from '@actions/v1/actionAccess/nullifyCounterActionAccess'

import UserActionAccessService from '@services/userActionAccess'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Action ${NullifyCounterActionAccessAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userActionAccessServiceMock = mockInstance(UserActionAccessService)

    const nullifyCounterActionAccessAction = new NullifyCounterActionAccessAction(userActionAccessServiceMock)

    describe('method `handler`', () => {
        it('should successfully nullify counter action access', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', actionAccessType: ActionAccessType.AddBirthCertificate },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userActionAccessServiceMock, 'nullifyCounterActionAccess').mockResolvedValueOnce()

            await nullifyCounterActionAccessAction.handler(args)

            expect(userActionAccessServiceMock.nullifyCounterActionAccess).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.actionAccessType,
            )
        })
    })
})
