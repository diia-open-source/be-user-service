import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentTypeCamelCase } from '@diia-inhouse/types'

import GetDocumentsTypeOrderAction from '@actions/v2/userDocument/getDocumentsTypeOrder'

import UserDocumentSettingsService from '@services/userDocumentSettings'

describe(`Action ${GetDocumentsTypeOrderAction.name}`, () => {
    const testKit = new TestKit()
    const userDocumentSettingsService = mockInstance(UserDocumentSettingsService)
    const action = new GetDocumentsTypeOrderAction(userDocumentSettingsService)

    it('should call getDocumentsTypeOrder', async () => {
        const headers = testKit.session.getHeaders()
        const session = testKit.session.getDiiaOfficeUserSession()
        const { user, features } = session
        const { identifier: userIdentifier } = user
        const documentsTypeOrder = [DocumentTypeCamelCase.uId, DocumentTypeCamelCase.idCard, DocumentTypeCamelCase.taxpayerCard]

        jest.spyOn(userDocumentSettingsService, 'getDocumentsTypeOrder').mockResolvedValueOnce(documentsTypeOrder)

        const result = await action.handler({ session, headers })

        expect(userDocumentSettingsService.getDocumentsTypeOrder).toHaveBeenCalledWith({ userIdentifier, features })
        expect(result).toEqual({ documentsTypeOrder })
    })
})
