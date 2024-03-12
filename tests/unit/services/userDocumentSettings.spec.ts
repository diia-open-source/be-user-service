import { randomUUID } from 'crypto'

import { UpdateWriteOpResult } from 'mongoose'

import { IdentifierService } from '@diia-inhouse/crypto'
import { BadRequestError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DiiaOfficeProfileData, DocumentType, DocumentTypeCamelCase, ProfileFeature, SessionType } from '@diia-inhouse/types'

import UserDocumentSettingsService from '@services/userDocumentSettings'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { UserDocumentSettingsModel } from '@interfaces/models/userDocumentSettings'
import { DocumentTypeWithOrder, UserDocumentsOrderResponse } from '@interfaces/services/userDocumentSettings'

describe('UserDocumentSettingsService', () => {
    const testKit = new TestKit()
    const identifierServiceMock = mockInstance(IdentifierService)
    const userDocumentSettingsService = new UserDocumentSettingsService(identifierServiceMock)

    describe('method: saveDocumentsOrder', () => {
        const { user } = testKit.session.getUserSession()
        const { identifier: userIdentifier } = user
        const params = { userIdentifier }
        const documentsOrder = [
            { order: 1, documentType: DocumentType.InternalPassport },
            { order: 2, documentType: DocumentType.DriverLicense },
        ]
        const expectedUserDocumentSettings = {
            [`${DocumentType.InternalPassport}.documentTypeOrder`]: 1,
            [`${DocumentType.DriverLicense}.documentTypeOrder`]: 2,
            [`${DocumentType.MilitaryBond}.documentTypeOrder`]: -1,
            [`${DocumentType.HousingCertificate}.documentTypeOrder`]: -1,
            [`${DocumentType.UId}.documentTypeOrder`]: -1,
            [`${DocumentType.TaxpayerCard}.documentTypeOrder`]: -1,
            [`${DocumentType.LocalVaccinationCertificate}.documentTypeOrder`]: -1,
            [`${DocumentType.InternationalVaccinationCertificate}.documentTypeOrder`]: -1,
            [`${DocumentType.ChildLocalVaccinationCertificate}.documentTypeOrder`]: -1,
            [`${DocumentType.ForeignPassport}.documentTypeOrder`]: -1,
            [`${DocumentType.ResidencePermitPermanent}.documentTypeOrder`]: -1,
            [`${DocumentType.ResidencePermitTemporary}.documentTypeOrder`]: -1,
            [`${DocumentType.PensionCard}.documentTypeOrder`]: -1,
            [`${DocumentType.VehicleLicense}.documentTypeOrder`]: -1,
            [`${DocumentType.StudentIdCard}.documentTypeOrder`]: -1,
            [`${DocumentType.RefInternallyDisplacedPerson}.documentTypeOrder`]: -1,
            [`${DocumentType.BirthCertificate}.documentTypeOrder`]: -1,
            [`${DocumentType.EResidency}.documentTypeOrder`]: -1,
            [`${DocumentType.EResidentPassport}.documentTypeOrder`]: -1,
            [`${DocumentType.VehicleInsurance}.documentTypeOrder`]: -1,
            [`${DocumentType.OfficialCertificate}.documentTypeOrder`]: -1,
            [`${DocumentType.EducationDocument}.documentTypeOrder`]: -1,
        }

        it('should create user document settings model when there is no one', async () => {
            jest.spyOn(identifierServiceMock, 'getSessionTypeFromIdentifier').mockReturnValueOnce(SessionType.User)
            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(undefined)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(userDocumentSettingsModel, 'create').mockResolvedValueOnce(<any>{})

            await userDocumentSettingsService.saveDocumentsOrder(params, documentsOrder)

            expect(userDocumentSettingsModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(userDocumentSettingsModel.create).toHaveBeenCalledWith({
                userIdentifier,
                ...expectedUserDocumentSettings,
            })
        })

        it('should update user documents settings model when there is one', async () => {
            jest.spyOn(identifierServiceMock, 'getSessionTypeFromIdentifier').mockReturnValueOnce(SessionType.User)
            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce({
                userIdentifier,
                [`${DocumentType.InternalPassport}.documentTypeOrder`]: { documentsOrder: 2 },
                [`${DocumentType.DriverLicense}.documentTypeOrder`]: { documentsOrder: 1 },
                [`${DocumentType.MilitaryBond}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.HousingCertificate}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.UId}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.TaxpayerCard}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.LocalVaccinationCertificate}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.InternationalVaccinationCertificate}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.ChildLocalVaccinationCertificate}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.ForeignPassport}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.ResidencePermitPermanent}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.ResidencePermitTemporary}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.PensionCard}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.VehicleLicense}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.StudentIdCard}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.RefInternallyDisplacedPerson}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.BirthCertificate}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.EResidency}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.EResidentPassport}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.VehicleInsurance}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.OfficialCertificate}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${DocumentType.EducationDocument}.documentTypeOrder`]: { documentsOrder: -1 },
            })
            jest.spyOn(userDocumentSettingsModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 1 })

            await userDocumentSettingsService.saveDocumentsOrder(params, documentsOrder)

            expect(identifierServiceMock.getSessionTypeFromIdentifier).toHaveBeenCalledWith(userIdentifier)
            expect(userDocumentSettingsModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(userDocumentSettingsModel.updateOne).toHaveBeenCalledWith({ userIdentifier }, expectedUserDocumentSettings)
        })

        it.each([
            [
                'document type is not supported',
                [{ order: 1, documentType: <DocumentType>'unknown' }],
                new BadRequestError('Document type is not supported', { documentType: 'unknown' }),
            ],
            [
                'Invalid order number',
                [{ order: 'invalid-number', documentType: DocumentType.DriverLicense }],
                new BadRequestError('Invalid order number', { order: 'invalid-number', documentType: DocumentType.DriverLicense }),
            ],
            [
                'Duplicated order number',
                [
                    { order: 0, documentType: DocumentType.DriverLicense },
                    { order: 0, documentType: DocumentType.DriverLicense },
                ],
                new BadRequestError('Duplicated order number', { order: 0, documentType: DocumentType.DriverLicense }),
            ],
            [
                'Duplicated document type',
                [
                    { order: 0, documentType: DocumentType.DriverLicense },
                    { order: 1, documentType: DocumentType.DriverLicense },
                ],
                new BadRequestError('Duplicated document type', { order: 1, documentType: DocumentType.DriverLicense }),
            ],
        ])('should fail with error in case %s', async (_msg, inputDocumentsOrder, expectedError) => {
            jest.spyOn(identifierServiceMock, 'getSessionTypeFromIdentifier').mockReturnValueOnce(SessionType.User)

            await expect(async () => {
                await userDocumentSettingsService.saveDocumentsOrder(params, <DocumentTypeWithOrder[]>inputDocumentsOrder)
            }).rejects.toEqual(expectedError)

            expect(identifierServiceMock.getSessionTypeFromIdentifier).toHaveBeenCalledWith(userIdentifier)
        })
    })

    describe('method: getDocumentsOrder', () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()

        it.each([
            [
                'user has document settings for all document types',
                [
                    { documentIdentifiers: ['thirdDoc', 'firstDoc', 'secondDoc'], documentType: DocumentType.InternalPassport },
                    { documentIdentifiers: [], documentType: DocumentType.ForeignPassport },
                    { documentIdentifiers: ['secondDoc', 'firstDoc', 'thirdDoc'], documentType: DocumentType.DriverLicense },
                    { documentIdentifiers: [], documentType: DocumentType.MilitaryBond },
                    { documentIdentifiers: [], documentType: DocumentType.LocalVaccinationCertificate },
                    { documentIdentifiers: [], documentType: DocumentType.InternationalVaccinationCertificate },
                    { documentIdentifiers: ['firstDoc', 'secondDoc', 'thirdDoc'], documentType: DocumentType.UId },
                    { documentIdentifiers: [], documentType: DocumentType.BirthCertificate },
                    { documentIdentifiers: [], documentType: DocumentType.EResidentPassport },
                    { documentIdentifiers: [], documentType: DocumentType.EResidency },
                    { documentIdentifiers: [], documentType: DocumentType.PensionCard },
                    { documentIdentifiers: [], documentType: DocumentType.RefInternallyDisplacedPerson },
                    { documentIdentifiers: [], documentType: DocumentType.ResidencePermitTemporary },
                    { documentIdentifiers: [], documentType: DocumentType.ResidencePermitPermanent },
                    { documentIdentifiers: [], documentType: DocumentType.TaxpayerCard },
                    { documentIdentifiers: [], documentType: DocumentType.StudentIdCard },
                    { documentIdentifiers: [], documentType: DocumentType.VehicleInsurance },
                    { documentIdentifiers: [], documentType: DocumentType.VehicleLicense },
                    { documentIdentifiers: [], documentType: DocumentType.ChildLocalVaccinationCertificate },
                    { documentIdentifiers: [], documentType: DocumentType.HousingCertificate },
                    { documentIdentifiers: [], documentType: DocumentType.EducationDocument },
                ],
                new userDocumentSettingsModel({
                    [DocumentType.BirthCertificate]: {
                        documentTypeOrder: 10,
                    },
                    [DocumentType.ChildLocalVaccinationCertificate]: {
                        documentTypeOrder: 23,
                    },
                    [DocumentType.EResidency]: {
                        documentTypeOrder: 12,
                    },
                    [DocumentType.EResidentPassport]: {
                        documentTypeOrder: 11,
                    },
                    [DocumentType.InternationalVaccinationCertificate]: {
                        documentTypeOrder: 6,
                    },
                    [DocumentType.LocalVaccinationCertificate]: {
                        documentTypeOrder: 5,
                    },
                    [DocumentType.MilitaryBond]: {
                        documentTypeOrder: 3,
                    },
                    [DocumentType.OfficialCertificate]: {
                        documentTypeOrder: 4,
                    },
                    [DocumentType.PensionCard]: {
                        documentTypeOrder: 13,
                    },
                    [DocumentType.RefInternallyDisplacedPerson]: {
                        documentTypeOrder: 15,
                    },
                    [DocumentType.ResidencePermitPermanent]: {
                        documentTypeOrder: 17,
                    },
                    [DocumentType.ResidencePermitTemporary]: {
                        documentTypeOrder: 16,
                    },
                    [DocumentType.StudentIdCard]: {
                        documentTypeOrder: 19,
                    },
                    [DocumentType.TaxpayerCard]: {
                        documentTypeOrder: 18,
                    },
                    [DocumentType.VehicleInsurance]: {
                        documentTypeOrder: 20,
                    },
                    [DocumentType.VehicleLicense]: {
                        documentTypeOrder: 22,
                    },
                    [DocumentType.HousingCertificate]: {
                        documentTypeOrder: 24,
                    },
                    [DocumentType.EducationDocument]: {
                        documentTypeOrder: 25,
                    },
                    [DocumentType.UId]: {
                        documentTypeOrder: 8,
                        documentIdentifiers: {
                            firstDoc: 2,
                            secondDoc: 4,
                            thirdDoc: 7,
                        },
                    },
                    [DocumentType.DriverLicense]: {
                        documentTypeOrder: 2,
                        documentIdentifiers: {
                            firstDoc: 1,
                            secondDoc: 0,
                            thirdDoc: 3,
                        },
                    },
                    [DocumentType.InternalPassport]: {
                        documentTypeOrder: 0,
                        documentIdentifiers: {
                            firstDoc: 1,
                            secondDoc: 3,
                            thirdDoc: 0,
                        },
                    },
                    [DocumentType.ForeignPassport]: {
                        documentTypeOrder: 1,
                    },
                }),
            ],
            [
                'user has no document settings',
                [
                    { documentType: DocumentType.MilitaryBond },
                    { documentType: DocumentType.HousingCertificate },
                    { documentType: DocumentType.UId },
                    { documentType: DocumentType.TaxpayerCard },
                    { documentType: DocumentType.LocalVaccinationCertificate },
                    { documentType: DocumentType.InternationalVaccinationCertificate },
                    { documentType: DocumentType.ChildLocalVaccinationCertificate },
                    { documentType: DocumentType.InternalPassport },
                    { documentType: DocumentType.ForeignPassport },
                    { documentType: DocumentType.ResidencePermitPermanent },
                    { documentType: DocumentType.ResidencePermitTemporary },
                    { documentType: DocumentType.PensionCard },
                    { documentType: DocumentType.DriverLicense },
                    { documentType: DocumentType.VehicleLicense },
                    { documentType: DocumentType.StudentIdCard },
                    { documentType: DocumentType.RefInternallyDisplacedPerson },
                    { documentType: DocumentType.BirthCertificate },
                    { documentType: DocumentType.EResidency },
                    { documentType: DocumentType.EResidentPassport },
                    { documentType: DocumentType.EducationDocument },
                    { documentType: DocumentType.VehicleInsurance },
                ],
                undefined,
            ],
        ])(
            'should return documents order when %s',
            async (
                _msg: string,
                expectedDocumentsOrder: UserDocumentsOrderResponse[],
                validUserDocumentSettingsModel?: UserDocumentSettingsModel,
            ) => {
                jest.spyOn(identifierServiceMock, 'getSessionTypeFromIdentifier').mockReturnValueOnce(SessionType.User)
                jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(validUserDocumentSettingsModel)

                const result = await userDocumentSettingsService.getDocumentsOrder({
                    userIdentifier,
                })

                expect(result).toEqual(expectedDocumentsOrder)

                expect(identifierServiceMock.getSessionTypeFromIdentifier).toHaveBeenCalledWith(userIdentifier)
                expect(userDocumentSettingsModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            },
        )
    })

    describe('method: getDocumentsTypeOrder', () => {
        it.each([
            [
                `user with session type ${SessionType.User} has no document settings`,
                { userIdentifier: testKit.session.getUserSession().user.identifier },
                SessionType.User,
                undefined,
                [
                    DocumentTypeCamelCase.militaryBond,
                    DocumentTypeCamelCase.housingCertificate,
                    DocumentTypeCamelCase.uId,
                    DocumentTypeCamelCase.taxpayerCard,
                    DocumentTypeCamelCase.localVaccinationCertificate,
                    DocumentTypeCamelCase.internationalVaccinationCertificate,
                    DocumentTypeCamelCase.childLocalVaccinationCertificate,
                    DocumentTypeCamelCase.idCard,
                    DocumentTypeCamelCase.foreignPassport,
                    DocumentTypeCamelCase.residencePermitPermanent,
                    DocumentTypeCamelCase.residencePermitTemporary,
                    DocumentTypeCamelCase.pensionCard,
                    DocumentTypeCamelCase.driverLicense,
                    DocumentTypeCamelCase.vehicleLicense,
                    DocumentTypeCamelCase.studentCard,
                    DocumentTypeCamelCase.referenceInternallyDisplacedPerson,
                    DocumentTypeCamelCase.birthCertificate,
                    DocumentTypeCamelCase.eResidency,
                    DocumentTypeCamelCase.eResidentPassport,
                    DocumentTypeCamelCase.educationDocument,
                    DocumentTypeCamelCase.vehicleLicense,
                ],
            ],
            [
                `user with session type ${SessionType.User} and office feature has no document settings`,
                {
                    userIdentifier: testKit.session.getUserSession().user.identifier,
                    features: { [ProfileFeature.office]: <DiiaOfficeProfileData>{} },
                },
                SessionType.User,
                undefined,
                [
                    DocumentTypeCamelCase.militaryBond,
                    DocumentTypeCamelCase.housingCertificate,
                    DocumentTypeCamelCase.uId,
                    DocumentTypeCamelCase.taxpayerCard,
                    DocumentTypeCamelCase.localVaccinationCertificate,
                    DocumentTypeCamelCase.internationalVaccinationCertificate,
                    DocumentTypeCamelCase.childLocalVaccinationCertificate,
                    DocumentTypeCamelCase.idCard,
                    DocumentTypeCamelCase.foreignPassport,
                    DocumentTypeCamelCase.residencePermitPermanent,
                    DocumentTypeCamelCase.residencePermitTemporary,
                    DocumentTypeCamelCase.pensionCard,
                    DocumentTypeCamelCase.driverLicense,
                    DocumentTypeCamelCase.vehicleLicense,
                    DocumentTypeCamelCase.studentCard,
                    DocumentTypeCamelCase.referenceInternallyDisplacedPerson,
                    DocumentTypeCamelCase.birthCertificate,
                    DocumentTypeCamelCase.eResidency,
                    DocumentTypeCamelCase.eResidentPassport,
                    DocumentTypeCamelCase.educationDocument,
                    DocumentTypeCamelCase.vehicleLicense,
                    DocumentTypeCamelCase.officialCertificate,
                ],
            ],
            [
                `user with session type ${SessionType.EResident} has no document settings`,
                { userIdentifier: testKit.session.getEResidentSession().user.identifier },
                SessionType.EResident,
                undefined,
                [DocumentTypeCamelCase.eResidency, DocumentTypeCamelCase.eResidentPassport],
            ],
            [
                `user with session type ${SessionType.User} has partial document settings`,
                { userIdentifier: testKit.session.getUserSession().user.identifier },
                SessionType.User,
                new userDocumentSettingsModel({
                    [DocumentType.UId]: { documentTypeOrder: 8 },
                    [DocumentType.DriverLicense]: { documentTypeOrder: 2 },
                    [DocumentType.InternalPassport]: { documentTypeOrder: 0 },
                    [DocumentType.ForeignPassport]: { documentTypeOrder: 1 },
                }),
                [
                    DocumentTypeCamelCase.idCard,
                    DocumentTypeCamelCase.foreignPassport,
                    DocumentTypeCamelCase.driverLicense,
                    DocumentTypeCamelCase.uId,
                    DocumentTypeCamelCase.militaryBond,
                    DocumentTypeCamelCase.housingCertificate,
                    DocumentTypeCamelCase.taxpayerCard,
                    DocumentTypeCamelCase.localVaccinationCertificate,
                    DocumentTypeCamelCase.internationalVaccinationCertificate,
                    DocumentTypeCamelCase.childLocalVaccinationCertificate,
                    DocumentTypeCamelCase.residencePermitPermanent,
                    DocumentTypeCamelCase.residencePermitTemporary,
                    DocumentTypeCamelCase.pensionCard,
                    DocumentTypeCamelCase.vehicleLicense,
                    DocumentTypeCamelCase.studentCard,
                    DocumentTypeCamelCase.referenceInternallyDisplacedPerson,
                    DocumentTypeCamelCase.birthCertificate,
                    DocumentTypeCamelCase.eResidency,
                    DocumentTypeCamelCase.eResidentPassport,
                    DocumentTypeCamelCase.educationDocument,
                    DocumentTypeCamelCase.vehicleLicense,
                ],
            ],
            [
                'user has document settings for all document types',
                { userIdentifier: testKit.session.getUserSession().user.identifier },
                SessionType.User,
                new userDocumentSettingsModel({
                    [DocumentType.BirthCertificate]: { documentTypeOrder: 10 },
                    [DocumentType.ChildLocalVaccinationCertificate]: { documentTypeOrder: 23 },
                    [DocumentType.EResidency]: { documentTypeOrder: 12 },
                    [DocumentType.EResidentPassport]: { documentTypeOrder: 11 },
                    [DocumentType.InternationalVaccinationCertificate]: { documentTypeOrder: 6 },
                    [DocumentType.LocalVaccinationCertificate]: { documentTypeOrder: 5 },
                    [DocumentType.MilitaryBond]: { documentTypeOrder: 3 },
                    [DocumentType.PensionCard]: { documentTypeOrder: 13 },
                    [DocumentType.RefInternallyDisplacedPerson]: { documentTypeOrder: 15 },
                    [DocumentType.ResidencePermitPermanent]: { documentTypeOrder: 17 },
                    [DocumentType.ResidencePermitTemporary]: { documentTypeOrder: 16 },
                    [DocumentType.StudentIdCard]: { documentTypeOrder: 19 },
                    [DocumentType.TaxpayerCard]: { documentTypeOrder: 18 },
                    [DocumentType.VehicleInsurance]: { documentTypeOrder: 20 },
                    [DocumentType.VehicleLicense]: { documentTypeOrder: 22 },
                    [DocumentType.UId]: { documentTypeOrder: 0 },
                    [DocumentType.DriverLicense]: { documentTypeOrder: 2 },
                    [DocumentType.InternalPassport]: { documentTypeOrder: 8 },
                    [DocumentType.ForeignPassport]: { documentTypeOrder: 1 },
                    [DocumentType.HousingCertificate]: { documentTypeOrder: 24 },
                    [DocumentType.EducationDocument]: { documentTypeOrder: 25 },
                }),
                [
                    DocumentTypeCamelCase.uId,
                    DocumentTypeCamelCase.foreignPassport,
                    DocumentTypeCamelCase.driverLicense,
                    DocumentTypeCamelCase.militaryBond,
                    DocumentTypeCamelCase.localVaccinationCertificate,
                    DocumentTypeCamelCase.internationalVaccinationCertificate,
                    DocumentTypeCamelCase.idCard,
                    DocumentTypeCamelCase.birthCertificate,
                    DocumentTypeCamelCase.eResidentPassport,
                    DocumentTypeCamelCase.eResidency,
                    DocumentTypeCamelCase.pensionCard,
                    DocumentTypeCamelCase.referenceInternallyDisplacedPerson,
                    DocumentTypeCamelCase.residencePermitTemporary,
                    DocumentTypeCamelCase.residencePermitPermanent,
                    DocumentTypeCamelCase.taxpayerCard,
                    DocumentTypeCamelCase.studentCard,
                    DocumentTypeCamelCase.vehicleLicense,
                    DocumentTypeCamelCase.vehicleLicense,
                    DocumentTypeCamelCase.childLocalVaccinationCertificate,
                    DocumentTypeCamelCase.housingCertificate,
                    DocumentTypeCamelCase.educationDocument,
                ],
            ],
        ])('should return documents order when %s', async (_msg, params, sessionType, documentSettings, expectedDocumentsTypeOrder) => {
            jest.spyOn(identifierServiceMock, 'getSessionTypeFromIdentifier').mockReturnValueOnce(sessionType)
            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(documentSettings)

            const result = await userDocumentSettingsService.getDocumentsTypeOrder(params)

            expect(result).toEqual(expectedDocumentsTypeOrder)
        })
    })

    describe('method: saveDocumentsOrderByDocumentType', () => {
        const {
            user: { identifier: userIdentifier },
        } = testKit.session.getUserSession()

        const defaultDocumentsSettings = {
            'birth-certificate.documentTypeOrder': -1,
            'child-local-vaccination-certificate.documentTypeOrder': -1,
            'driver-license.documentTypeOrder': -1,
            'e-residency.documentTypeOrder': -1,
            'e-resident-passport.documentTypeOrder': -1,
            'education-document.documentTypeOrder': -1,
            'foreign-passport.documentTypeOrder': -1,
            'housing-certificate.documentTypeOrder': -1,
            'internal-passport.documentTypeOrder': -1,
            'international-vaccination-certificate.documentTypeOrder': -1,
            'local-vaccination-certificate.documentTypeOrder': -1,
            'military-bond.documentTypeOrder': -1,
            'official-certificate.documentTypeOrder': -1,
            'pension-card.documentTypeOrder': -1,
            'reference-internally-displaced-person.documentTypeOrder': -1,
            'residence-permit-permanent.documentTypeOrder': -1,
            'residence-permit-temporary.documentTypeOrder': -1,
            'student-id-card.documentTypeOrder': -1,
            'taxpayer-card.documentTypeOrder': -1,
            'u-id.documentTypeOrder': -1,
            'vehicle-insurance.documentTypeOrder': -1,
            'vehicle-license.documentTypeOrder': -1,
        }

        it('should successfully save documents order by document type', async () => {
            const documentType = DocumentType.BirthCertificate
            const documentsOrder = [{ order: 1, docNumber: randomUUID() }]
            const documentIdentifier = randomUUID()

            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(undefined)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(userDocumentSettingsModel, 'create').mockResolvedValueOnce(<any>{})
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(documentIdentifier)
            jest.spyOn(userDocumentSettingsModel, 'updateOne').mockResolvedValueOnce(<UpdateWriteOpResult>{ modifiedCount: 1 })

            await userDocumentSettingsService.saveDocumentsOrderByDocumentType({ userIdentifier }, documentType, documentsOrder)

            expect(userDocumentSettingsModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(userDocumentSettingsModel.create).toHaveBeenCalledWith({ userIdentifier, ...defaultDocumentsSettings })
            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(documentsOrder[0].docNumber)
            expect(userDocumentSettingsModel.updateOne).toHaveBeenCalledWith(
                { userIdentifier },
                {
                    $set: {
                        [`${documentType}.documentIdentifiers`]: { [documentIdentifier]: documentsOrder[0].order },
                    },
                },
            )
        })

        it.each([
            ['input documents order list is empty', [], new BadRequestError('Please, define at least one document number')],
            [
                'order is floating point number',
                [{ order: 1.1, docNumber: 'doc-number' }],
                new BadRequestError('Invalid order number', { order: 1.1, docNumber: 'doc-number' }),
            ],
            [
                'order number is less than 0',
                [{ order: -1, docNumber: 'doc-number' }],
                new BadRequestError('Invalid order number', { order: -1, docNumber: 'doc-number' }),
            ],
            [
                'order number is 0',
                [{ order: 0, docNumber: 'doc-number' }],
                new BadRequestError('Invalid order number', { order: 0, docNumber: 'doc-number' }),
            ],
            [
                'duplicated order number',
                [
                    { order: 1, docNumber: 'doc-number1' },
                    { order: 1, docNumber: 'doc-number2' },
                ],
                new BadRequestError('Duplicated order number', { order: 1, docNumber: 'doc-number2' }),
            ],
            [
                'duplicated docNumber',
                [
                    { order: 1, docNumber: 'doc-number' },
                    { order: 2, docNumber: 'doc-number' },
                ],
                new BadRequestError('Duplicated docNumber', { order: 2, docNumber: 'doc-number' }),
            ],
        ])('should fail with error in case %s', async (_msg, documentsOrder, expectedError) => {
            const documentType = DocumentType.BirthCertificate

            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(defaultDocumentsSettings)

            await expect(async () => {
                await userDocumentSettingsService.saveDocumentsOrderByDocumentType({ userIdentifier }, documentType, documentsOrder)
            }).rejects.toEqual(expectedError)
        })
    })
})
