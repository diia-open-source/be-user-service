import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetEResidentHistoryByActionAction from '@actions/v1/userHistory/getEResidentHistoryByAction'

import UserHistoryService from '@services/userHistory'

import { HistoryAction } from '@interfaces/services/userHistory'

describe(`Action ${GetEResidentHistoryByActionAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userHistoryServiceMock = mockInstance(UserHistoryService)

    const getEResidentHistoryByActionAction = new GetEResidentHistoryByActionAction(userHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return history by actions', async () => {
            const args = {
                params: {
                    action: HistoryAction.Sharing,
                    session: 'session',
                    skip: 1,
                    limit: 10,
                },
                session: testKit.session.getEResidentSession(),
                headers,
            }

            const historyResponse = {
                history: [],
                total: 10,
            }

            jest.spyOn(userHistoryServiceMock, 'getHistoryByAction').mockResolvedValueOnce(historyResponse)

            expect(await getEResidentHistoryByActionAction.handler(args)).toMatchObject(historyResponse)

            expect(userHistoryServiceMock.getHistoryByAction).toHaveBeenCalledWith(
                args.params.action,
                args.session.user.identifier,
                args.params.session,
                args.params.skip,
                args.params.limit,
            )
        })
    })
})
