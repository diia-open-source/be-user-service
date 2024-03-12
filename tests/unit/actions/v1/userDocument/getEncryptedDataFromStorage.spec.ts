import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

import GetEncryptedDataFromStorageAction from '@actions/v1/userDocument/getEncryptedDataFromStorage'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { EncryptedDataByDocumentType } from '@interfaces/services/userDocumentStorage'

describe(`Action ${GetEncryptedDataFromStorageAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const getEncryptedDataFromStorageAction = new GetEncryptedDataFromStorageAction(userDocumentStorageServiceMock)

    describe('method `handler`', () => {
        it('should return encrypted data from storage', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    mobileUid: headers.mobileUid,
                    documentTypes: [DocumentType.VehicleLicense],
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            const mockDataForVehicleLicense: string[] = ['encrypted-data-3']

            const mockEncryptedData: EncryptedDataByDocumentType = {
                [DocumentType.VehicleLicense]: mockDataForVehicleLicense,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'getEncryptedDataFromStorage').mockResolvedValueOnce(mockEncryptedData)

            expect(await getEncryptedDataFromStorageAction.handler(args)).toMatchObject(mockEncryptedData)

            expect(userDocumentStorageServiceMock.getEncryptedDataFromStorage).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.mobileUid,
                args.params.documentTypes,
            )
        })
    })
})
