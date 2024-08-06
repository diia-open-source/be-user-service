import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetHistoryByActionAction from '@actions/v2/userHistory/getHistoryByAction'

import UserHistoryService from '@services/userHistory'

import { UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryByActionAction.name}`, () => {
    const testKit = new TestKit()
    const userHistoryService = mockInstance(UserHistoryService)

    const action = new GetHistoryByActionAction(userHistoryService)

    describe('Method `handler`', () => {
        it('should return signing history by code', async () => {
            const args = {
                params: { action: UserHistoryCode.Signing, skip: 1, limit: 10 },
                session: testKit.session.getUserSession(),
                headers: testKit.session.getHeaders(),
            }

            const response = {
                items: [
                    {
                        id: '1',
                        status: UserHistoryItemStatus.Processing,
                        statusName: 'statusName',
                        recipient: { name: 'name', address: 'address' },
                        date: new Date().toDateString(),
                    },
                ],
                total: 10,
            }

            jest.spyOn(userHistoryService, 'getHistoryItemsV1').mockResolvedValueOnce(response)

            expect(await action.handler(args)).toMatchObject(response)

            expect(userHistoryService.getHistoryItemsV1).toHaveBeenCalledWith(
                args.params.action,
                args.session.user.identifier,
                args.params.skip,
                args.params.limit,
            )
        })
    })
})
