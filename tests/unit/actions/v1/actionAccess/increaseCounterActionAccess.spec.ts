import TestKit, { mockInstance } from '@diia-inhouse/test'

import IncreaseCounterActionAccessAction from '@actions/v1/actionAccess/increaseCounterActionAccess'

import UserActionAccessService from '@services/userActionAccess'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

describe(`Action ${IncreaseCounterActionAccessAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userActionAccessServiceMock = mockInstance(UserActionAccessService)

    const increaseCounterActionAccessAction = new IncreaseCounterActionAccessAction(userActionAccessServiceMock)

    describe('method `handler`', () => {
        it('should successfully execute method', async () => {
            const args = {
                params: { userIdentifier: 'userIdentifier', actionAccessType: ActionAccessType.AddBirthCertificate },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userActionAccessServiceMock, 'increaseCounterActionAccess').mockResolvedValueOnce()

            await increaseCounterActionAccessAction.handler(args)

            expect(userActionAccessServiceMock.increaseCounterActionAccess).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.actionAccessType,
            )
        })
    })
})
