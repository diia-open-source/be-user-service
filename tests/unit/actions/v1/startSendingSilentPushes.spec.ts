import { EventBus } from '@diia-inhouse/diia-queue'
import { BadRequestError, InternalServerError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'

import StartSendingSilentPushesAction from '@actions/v1/startSendingSilentPushes'

import NotificationService from '@services/notification'

import { InternalEvent } from '@interfaces/queue'

describe(`Action ${StartSendingSilentPushesAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const notificationServiceMock = mockInstance(NotificationService)
    const eventBusMock = mockInstance(EventBus)

    const startSendingSilentPushesAction = new StartSendingSilentPushesAction(notificationServiceMock, eventBusMock)

    describe('method `handler`', () => {
        const args = {
            params: {
                actionType: 'actionType',
            },
            session: testKit.session.getUserSession(),
            headers,
        }

        it('should throw error if silent action does not exist', async () => {
            jest.spyOn(notificationServiceMock, 'isSilentActionExists').mockResolvedValueOnce(false)

            await expect(async () => {
                await startSendingSilentPushesAction.handler(args)
            }).rejects.toEqual(
                new BadRequestError('There is no silent actions with provided actionType', {
                    actionType: args.params.actionType,
                }),
            )

            expect(notificationServiceMock.isSilentActionExists).toHaveBeenCalledWith(args.params.actionType)
        })

        it('should throw error if failed to publish event', async () => {
            jest.spyOn(notificationServiceMock, 'isSilentActionExists').mockResolvedValueOnce(true)
            jest.spyOn(eventBusMock, 'publish').mockResolvedValueOnce(false)

            await expect(async () => {
                await startSendingSilentPushesAction.handler(args)
            }).rejects.toEqual(new InternalServerError('Failed to publish event'))

            expect(notificationServiceMock.isSilentActionExists).toHaveBeenCalledWith(args.params.actionType)
            expect(eventBusMock.publish).toHaveBeenCalledWith(InternalEvent.UserSendMassSilentPushes, {
                actionType: args.params.actionType,
            })
        })

        it('should return true if published event', async () => {
            jest.spyOn(notificationServiceMock, 'isSilentActionExists').mockResolvedValueOnce(true)
            jest.spyOn(eventBusMock, 'publish').mockResolvedValueOnce(true)

            expect(await startSendingSilentPushesAction.handler(args)).toMatchObject({ success: true })

            expect(notificationServiceMock.isSilentActionExists).toHaveBeenCalledWith(args.params.actionType)
            expect(eventBusMock.publish).toHaveBeenCalledWith(InternalEvent.UserSendMassSilentPushes, {
                actionType: args.params.actionType,
            })
        })
    })
})
