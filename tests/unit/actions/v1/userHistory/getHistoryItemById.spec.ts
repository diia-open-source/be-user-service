import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetHistoryItemByIdAction from '@actions/v1/userHistory/getHistoryItemById'

import UserSigningHistoryService from '@services/userSigningHistory'

import { UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryItemByIdAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userSigningHistoryServiceMock = mockInstance(UserSigningHistoryService)

    const getHistoryItemByIdAction = new GetHistoryItemByIdAction(userSigningHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return signing history', async () => {
            const args = {
                params: {
                    itemId: 'itemId',
                    actionCode: UserHistoryCode.Authorization,
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const signingHistoryItemResponse = {
                screen: {
                    title: 'title',
                    status: UserHistoryItemStatus.Done,
                    statusMessage: {
                        icon: 'icon',
                        parameters: [],
                    },
                    recipient: { name: 'name', address: 'address' },
                    body: [],
                },
            }

            jest.spyOn(userSigningHistoryServiceMock, 'getSigningHistoryItemByIdV1').mockResolvedValueOnce(signingHistoryItemResponse)

            expect(await getHistoryItemByIdAction.handler(args)).toMatchObject(signingHistoryItemResponse)

            expect(userSigningHistoryServiceMock.getSigningHistoryItemByIdV1).toHaveBeenCalledWith(
                args.params.itemId,
                args.session.user.identifier,
                args.params.actionCode,
            )
        })
    })
})
