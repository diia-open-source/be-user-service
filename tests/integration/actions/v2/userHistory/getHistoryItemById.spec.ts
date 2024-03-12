import { randomUUID } from 'crypto'

import TestKit from '@diia-inhouse/test'

import GetHistoryItemByIdAction from '@src/actions/v2/userHistory/getHistoryItemById'

import userSigningHistoryItemModel from '@models/userSigningHistoryItem'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'
import UserSigningHistoryDataMapper from '@dataMappers/userSigningHistoryDataMapper'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v2/userHistory/getHistoryItemById'
import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'
import { GetHistoryItemBodyPayload, UserHistoryCode, UserHistoryItemStatus } from '@interfaces/services/userHistory'

describe(`Action ${GetHistoryItemByIdAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getHistoryItemByIdAction: GetHistoryItemByIdAction
    let testKit: TestKit
    let userHistoryDataMapper: UserHistoryDataMapper
    let userSigningHistoryDataMapper: UserSigningHistoryDataMapper

    beforeAll(async () => {
        app = await getApp()

        getHistoryItemByIdAction = app.container.build(GetHistoryItemByIdAction)
        testKit = app.container.resolve('testKit')
        userHistoryDataMapper = app.container.resolve('userHistoryDataMapper')
        userSigningHistoryDataMapper = app.container.resolve<UserSigningHistoryDataMapper>('userSigningHistoryDataMapper')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return detailed info about signing item', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const {
            user: { identifier: userIdentifier },
        } = session

        const { platformType, platformVersion } = headers

        const status = UserHistoryItemStatus.Done
        const action = UserHistoryCode.Signing

        const signingHistoryItems: UserSigningHistoryItem[] = [
            {
                userIdentifier,
                sessionId: randomUUID(),
                resourceId: randomUUID(),
                platformType,
                platformVersion,
                action: 'hashedFilesSigningDiiaId',
                status,
                statusHistory: [
                    {
                        status,
                        date: new Date(),
                    },
                ],
                documents: ['someDocument'],
                recipient: {
                    name: 'recipientName',
                    address: 'recipientAddress',
                },
                date: new Date(),
            },
        ]

        const navigationPanelMlc = userHistoryDataMapper.getHistoryScreenNavigationPanelMlc()

        const address = signingHistoryItems[0].recipient!.address

        const payload: GetHistoryItemBodyPayload = {
            platformType: signingHistoryItems[0].platformType,
            platformVersion: signingHistoryItems[0].platformVersion,
            documents: signingHistoryItems[0].documents,
        }

        const textLabelMlc = userSigningHistoryDataMapper.getHistoryItemTextLabelMlcByAction(action, address, payload)

        const createdSigningHistoryItems = await userSigningHistoryItemModel.insertMany(signingHistoryItems)

        // Act
        const result = await getHistoryItemByIdAction.handler({
            session,
            headers,
            params: {
                actionCode: action,
                itemId: signingHistoryItems[0].resourceId,
            },
        })

        // Assert

        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc,
                    },
                },
            ],
            body: [
                {
                    titleLabelMlc: {
                        label: userHistoryDataMapper.getHistoryItemTitleByAction(action),
                    },
                },
                {
                    statusMessageMlc: {
                        icon: userHistoryDataMapper.getHistoryItemStatusMessageIconByStatus(status),
                        title: expect.any(String),
                        text: expect.any(String),
                        parameters: [],
                    },
                },
                {
                    subtitleLabelMlc: {
                        label: expect.any(String),
                    },
                },
                { textLabelMlc },
            ],
        })

        // Cleanup
        const createdSigningHistoryItemsIds = createdSigningHistoryItems.map((item) => item._id)

        await userSigningHistoryItemModel.deleteMany({ _id: { $in: createdSigningHistoryItemsIds } })
    })
})
