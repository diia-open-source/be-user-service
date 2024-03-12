import TestKit, { mockInstance } from '@diia-inhouse/test'
import { PlatformType } from '@diia-inhouse/types'

import GetHistoryByActionAction from '@actions/v1/userHistory/getHistoryByAction'

import UserHistoryService from '@services/userHistory'

import { HistoryAction } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryByActionAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userHistoryServiceMock = mockInstance(UserHistoryService)

    const getHistoryByActionAction = new GetHistoryByActionAction(userHistoryServiceMock)

    describe('method `handler`', () => {
        it('should return history by action', async () => {
            const args = {
                params: {
                    action: HistoryAction.Sharing,
                    session: 'session',
                    skip: 1,
                    limit: 10,
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const historyResponse = {
                history: [],
                total: 10,
            }

            jest.spyOn(userHistoryServiceMock, 'getHistoryByAction').mockResolvedValueOnce(historyResponse)

            expect(await getHistoryByActionAction.handler(args)).toMatchObject(historyResponse)

            expect(userHistoryServiceMock.getHistoryByAction).toHaveBeenCalledWith(
                args.params.action,
                args.session.user.identifier,
                args.params.session,
                args.params.skip,
                args.params.limit,
            )
        })

        it('should return empty history array if app version < 3.0.16 and android platform type', async () => {
            const localHeaders = { ...headers, platformType: PlatformType.Android, appVersion: '3.0.15' }

            const args = {
                params: {
                    action: HistoryAction.Sharing,
                    session: 'session',
                    skip: 1,
                    limit: 10,
                },
                session: testKit.session.getUserSession(),
                headers: localHeaders,
            }

            const historyResponse = {
                history: [],
                total: 0,
            }

            jest.spyOn(userHistoryServiceMock, 'getHistoryByAction').mockResolvedValueOnce(historyResponse)

            expect(await getHistoryByActionAction.handler(args)).toMatchObject(historyResponse)
        })

        it('should return empty history array if app version < 3.0.20 and ios platform type', async () => {
            const localHeaders = { ...headers, platformType: PlatformType.iOS, appVersion: '3.0.19' }

            const args = {
                params: {
                    action: HistoryAction.Sharing,
                    session: 'session',
                    skip: 1,
                    limit: 10,
                },
                session: testKit.session.getUserSession(),
                headers: localHeaders,
            }

            const historyResponse = {
                history: [],
                total: 0,
            }

            jest.spyOn(userHistoryServiceMock, 'getHistoryByAction').mockResolvedValueOnce(historyResponse)

            expect(await getHistoryByActionAction.handler(args)).toMatchObject(historyResponse)
        })
    })
})
