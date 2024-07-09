import TestKit, { mockInstance } from '@diia-inhouse/test'

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
        const documentsTypeOrder = ['uId', 'idCard', 'taxpayerCard']

        jest.spyOn(userDocumentSettingsService, 'getDocumentsTypeOrder').mockResolvedValueOnce(documentsTypeOrder)

        const result = await action.handler({ session, headers })

        expect(userDocumentSettingsService.getDocumentsTypeOrder).toHaveBeenCalledWith({ userIdentifier, features })
        expect(result).toEqual({ documentsTypeOrder })
    })
})
