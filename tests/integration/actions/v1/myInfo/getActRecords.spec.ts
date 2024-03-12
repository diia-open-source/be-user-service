import { randomUUID as uuid } from 'crypto'

import TestKit from '@diia-inhouse/test'
import { DocStatus, DocumentTypeCamelCase, Icon, RelationshipActRecordSubtype } from '@diia-inhouse/types'

import GetActRecordsAction from '@src/actions/v1/myInfo/getActRecords'
import { ActRecordRequestType, DocumentItem } from '@src/generated'

import DocumentsService from '@services/documents'
import UserDocumentService from '@services/userDocument'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/myInfo/getActRecords'
import { ActionType } from '@interfaces/services/myInfo'

describe(`Action ${GetActRecordsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let getActRecordsAction: GetActRecordsAction
    let userDocumentService: UserDocumentService
    let documentsService: DocumentsService
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        getActRecordsAction = app.container.build(GetActRecordsAction)
        userDocumentService = app.container.resolve<UserDocumentService>('userDocumentService')
        documentsService = app.container.resolve<DocumentsService>('documentsService')
        testKit = app.container.resolve('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should return marriage act records list when exist and itn valid', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        const eventDate = new Date('2019-01-13').toISOString()

        const docId = uuid()
        const docNumber = uuid()

        const partnerFullName = uuid()

        const documentItem: DocumentItem = {
            status: DocStatus.Ok,
            eTag: 'etag123',
            data: [
                {
                    id: docId,
                    docStatus: DocStatus.Ok,
                    docNumber,
                    docData: {
                        docName: '',
                        partnerFullName,
                        eventDate,
                        relationshipActRecordSubtype: RelationshipActRecordSubtype.marriage,
                    },
                    fullInfo: [],
                    content: [],
                },
            ],
        }

        jest.spyOn(userDocumentService, 'hasDocumentsByFilters').mockResolvedValueOnce({ hasDocuments: true, missingDocuments: [] })
        jest.spyOn(documentsService, 'getDesignSystemDocumentsToProcess').mockResolvedValueOnce({
            [DocumentTypeCamelCase.marriageActRecord]: documentItem,
        })

        // Act
        const result = await getActRecordsAction.handler({ session, headers, params: { recordType: ActRecordRequestType.marriage_record } })

        // Assert
        expect(result).toEqual<ActionResult>({
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc: {
                            label: expect.any(String),
                            ellipseMenu: expect.toBeContextMenu(),
                            iconAtm: {
                                componentId: 'back',
                                code: 'back',
                                accessibilityDescription: 'Кнопка: назад',
                                action: {
                                    type: 'back',
                                },
                            },
                        },
                    },
                },
            ],
            body: [
                {
                    listItemGroupOrg: {
                        items: [
                            {
                                label: partnerFullName,
                                description: `Дата шлюбу: 13.01.2019`,
                                iconRight: {
                                    code: Icon.ellipseArrowRight,
                                },
                                action: {
                                    type: ActionType.MarriageRecord,
                                    resource: docId,
                                },
                            },
                        ],
                    },
                },
            ],
            bottomGroup: [
                {
                    bottomGroupOrg: {
                        componentId: expect.any(String),
                        btnPrimaryDefaultAtm: {
                            componentId: expect.any(String),
                            label: 'Оновити дані',
                            action: {
                                type: ActionType.ForceUpdate,
                                subtype: ActionType.MarriageRecord,
                            },
                            actions: [],
                        },
                    },
                },
            ],
            data: {
                marriageRecord: documentItem,
            },
        })
    })
})
