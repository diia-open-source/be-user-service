import { randomUUID as uuid } from 'crypto'

import TestKit from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import HideActRecordAction from '@src/actions/v1/myInfo/hideActRecord'
import { ActRecordRequestType } from '@src/generated'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { getApp } from '@tests/utils/getApp'

import { ActionResult } from '@interfaces/actions/v1/myInfo/hideActRecord'
import { ProcessCode } from '@interfaces/services'

describe(`Action ${HideActRecordAction.name}`, () => {
    let app: Awaited<ReturnType<typeof getApp>>
    let hideActRecordAction: HideActRecordAction
    let testKit: TestKit

    beforeAll(async () => {
        app = await getApp()

        hideActRecordAction = app.container.build(HideActRecordAction)
        testKit = app.container.resolve<TestKit>('testKit')

        await app.start()
    })

    afterAll(async () => {
        await app.stop()
    })

    it('should save document id to db and return process code when force param is true', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()
        const userIdentifier = session.user.identifier

        const docId = uuid()

        // Act
        const result = await hideActRecordAction.handler({
            session,
            headers,
            params: { recordType: ActRecordRequestType.marriage_record, id: docId, force: true },
        })

        // Assert
        const settingsModel = await userDocumentSettingsModel.findOneAndDelete({ userIdentifier }).lean()

        expect(settingsModel?.userIdentifier).toEqual(userIdentifier)
        expect(settingsModel![DocumentType.MarriageActRecord]?.hiddenDocuments).toEqual([docId])
        expect(result).toEqual<ActionResult>({ processCode: ProcessCode.MarriageRecordHidden })
    })

    it('should return process code when force param is false', async () => {
        // Arrange
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getUserSession()

        // Act
        const result = await hideActRecordAction.handler({
            session,
            headers,
            params: { recordType: ActRecordRequestType.marriage_record, id: uuid(), force: false },
        })

        // Assert
        expect(result).toEqual<ActionResult>({ processCode: ProcessCode.HideMarriageRecord })
    })
})
