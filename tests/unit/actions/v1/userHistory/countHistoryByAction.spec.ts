import TestKit, { mockInstance } from '@diia-inhouse/test'

import CountHistoryByActionAction from '@actions/v1/userHistory/countHistoryByAction'

import UserHistoryService from '@services/userHistory'

import { HistoryAction } from '@interfaces/services/userHistory'

describe(`Action ${CountHistoryByActionAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userHistoryServiceMock = mockInstance(UserHistoryService)

    const countHistoryByActionAction = new CountHistoryByActionAction(userHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return history count by action', async () => {
            const args = {
                params: {
                    action: HistoryAction.Sharing,
                    sessionId: 'sessionId',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userHistoryServiceMock, 'countHistoryByAction').mockResolvedValueOnce(1)

            expect(await countHistoryByActionAction.handler(args)).toMatchObject({ count: 1 })

            expect(userHistoryServiceMock.countHistoryByAction).toHaveBeenCalledWith(
                args.params.action,
                args.session.user.identifier,
                args.params.sessionId,
            )
        })
    })
})
