import TestKit from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import UnhideActRecordsAction from '@src/actions/v1/myInfo/unhideActRecords'
import { ActRecordRequestType } from '@src/generated'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/myInfo/unhideActRecords'

describe(`Action ${UnhideActRecordsAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let unhideActRecordsAction: UnhideActRecordsAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        unhideActRecordsAction = app.container.build(UnhideActRecordsAction)
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should remove document id from model when model exists in db', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()
        const userIdentifier = session.user.identifier

        await userDocumentSettingsModel.create({
            userIdentifier,
            [DocumentType.MarriageActRecord]: {
                documentTypeOrder: '1',
                hiddenDocuments: ['1', '2'],
            },
            [DocumentType.DivorceActRecord]: {
                documentTypeOrder: '2',
                hiddenDocuments: ['3', '4'],
            },
        })

        // Act
        const result = await unhideActRecordsAction.handler({
            session,
            headers,
            params: { recordType: ActRecordRequestType.marriage_record },
        })

        // Assert
        const settingsModel = await userDocumentSettingsModel.findOneAndDelete({ userIdentifier }).lean()

        expect(settingsModel?.userIdentifier).toEqual(userIdentifier)
        expect(settingsModel![DocumentType.MarriageActRecord]?.hiddenDocuments).toEqual([])
        expect(settingsModel![DocumentType.DivorceActRecord]?.hiddenDocuments).toEqual(['3', '4'])
        expect(result).toEqual<ActionResult>({})
    })
})
