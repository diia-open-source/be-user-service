import TestKit, { mockInstance } from '@diia-inhouse/test'

import RemoveCovidCertificateFromStorageAction from '@actions/v1/userDocument/removeCovidCertificateFromStorage'

import UserDocumentStorageService from '@services/userDocumentStorage'

import { VaccinationCertificateType } from '@interfaces/services/userDocumentStorage'

describe(`Action ${RemoveCovidCertificateFromStorageAction.name}`, () => {
    const testKit = new TestKit()
    const headers = testKit.session.getHeaders()
    const userDocumentStorageServiceMock = mockInstance(UserDocumentStorageService)

    const removeCovidCertificateFromStorageAction = new RemoveCovidCertificateFromStorageAction(userDocumentStorageServiceMock)

    describe('method `handler`', () => {
        it('should successfully remove covid certificate from storage', async () => {
            const args = {
                params: {
                    userIdentifier: 'userIdentifier',
                    mobileUid: headers.mobileUid,
                    documentType: 'local-vaccination-certificate',
                    types: [VaccinationCertificateType.Vaccination],
                    birthCertificateId: 'birthCertificateId',
                },
                session: testKit.session.getUserSession(),
                headers,
            }

            jest.spyOn(userDocumentStorageServiceMock, 'removeCovidCertificateFromStorage').mockResolvedValueOnce()

            await removeCovidCertificateFromStorageAction.handler(args)

            expect(userDocumentStorageServiceMock.removeCovidCertificateFromStorage).toHaveBeenCalledWith(
                args.params.userIdentifier,
                args.params.documentType,
                args.params.mobileUid,
                args.params.types,
                args.params.birthCertificateId,
            )
        })
    })
})
