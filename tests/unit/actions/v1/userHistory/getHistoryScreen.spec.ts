import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetHistoryScreenAction from '@actions/v1/userHistory/getHistoryScreen'

import UserHistoryService from '@services/userHistory'

import { UserHistoryCode } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryScreenAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userHistoryServiceMock = mockInstance(UserHistoryService)

    const getHistoryScreenAction = new GetHistoryScreenAction(userHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return history screen', async () => {
            const args = {
                session: testKit.session.getUserSession(),
                headers,
            }

            const historyScreen = {
                tabs: {
                    items: [
                        {
                            name: 'name',
                            code: UserHistoryCode.Authorization,
                            count: 1,
                        },
                    ],
                    preselectedCode: UserHistoryCode.Authorization,
                },
            }

            jest.spyOn(userHistoryServiceMock, 'getHistoryScreenV1').mockResolvedValueOnce(historyScreen)

            expect(await getHistoryScreenAction.handler(args)).toMatchObject(historyScreen)

            expect(userHistoryServiceMock.getHistoryScreenV1).toHaveBeenCalledWith(args.session.user.identifier)
        })
    })
})
