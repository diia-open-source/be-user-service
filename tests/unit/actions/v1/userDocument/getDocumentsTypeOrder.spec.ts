import TestKit, { mockInstance } from '@diia-inhouse/test'

import GetDocumentsTypeOrderAction from '@actions/v1/userDocument/getDocumentsTypeOrder'

import UserDocumentSettingsService from '@services/userDocumentSettings'

describe(`Action ${GetDocumentsTypeOrderAction.name}`, () => {
    const testKit = new TestKit()
    const userDocumentSettingsService = mockInstance(UserDocumentSettingsService)
    const action = new GetDocumentsTypeOrderAction(userDocumentSettingsService)

    it('should call getDocumentsTypeOrder', async () => {
        const { session, headers } = testKit.session.getUserActionArguments()
        const { identifier: userIdentifier } = session.user
        const documentsTypeOrder = ['uId', 'idCard', 'taxpayerCard']

        jest.spyOn(userDocumentSettingsService, 'getDocumentsTypeOrder').mockResolvedValueOnce(documentsTypeOrder)

        const result = await action.handler({ session, headers })

        expect(userDocumentSettingsService.getDocumentsTypeOrder).toHaveBeenCalledWith({ userIdentifier })
        expect(result).toEqual({ documentsTypeOrder })
    })
})
