import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetHistoryScreenAction from '@actions/v2/userHistory/getHistoryScreen'

import UserHistoryService from '@services/userHistory'

import { HistoryScreenResponse, UserHistoryCode } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryScreenAction.name}`, () => {
    const testKit = new TestKit()
    const userHistoryService = mockInstance(UserHistoryService)

    const action = new GetHistoryScreenAction(userHistoryService)

    describe('Method `handler`', () => {
        it('should return history screen', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const response: HistoryScreenResponse = {
                topGroup: [
                    {
                        topGroupOrg: {
                            chipTabsOrg: {
                                items: [
                                    {
                                        code: UserHistoryCode.Authorization,
                                        label: 'Авторизації',
                                        count: 1,
                                    },
                                    {
                                        code: UserHistoryCode.Signing,
                                        label: 'Підписання',
                                        count: 1,
                                    },
                                ],
                                preselectedCode: UserHistoryCode.Authorization,
                            },
                        },
                    },
                ],
            }

            jest.spyOn(userHistoryService, 'getHistoryScreen').mockResolvedValueOnce(response)

            expect(await action.handler(args)).toMatchObject(response)

            expect(userHistoryService.getHistoryScreen).toHaveBeenCalledWith(args.session.user.identifier)
        })
    })
})
