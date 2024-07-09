import { randomUUID } from 'node:crypto'

import { IdentifierService } from '@diia-inhouse/crypto'
import { mongo } from '@diia-inhouse/db'
import { BadRequestError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { SessionType } from '@diia-inhouse/types'
import { utils } from '@diia-inhouse/utils'

import DocumentsService from '@services/documents'
import UserDocumentSettingsService from '@services/userDocumentSettings'

import userDocumentSettingsModel from '@models/userDocumentSettings'

import { UserDocumentSettingsModel } from '@interfaces/models/userDocumentSettings'
import { DocumentTypeWithOrder, UserDocumentsOrderResponse } from '@interfaces/services/userDocumentSettings'

const undefinedValue = undefined

describe('UserDocumentSettingsService', () => {
    const testKit = new TestKit()
    const identifierServiceMock = mockInstance(IdentifierService)
    const documentTypes = [
        'document-type1',
        'document-type2',
        'document-type3',
        'document-type4',
        'e-residency',
        'e-resident-passport',
        'official-certificate',
    ]
    const documentTypesWithoutOfficialCert = documentTypes.filter((documentType) => documentType !== 'official-certificate')
    const documentsServiceClientMock = <DocumentsService>(<unknown>{
        getSortedByDefaultDocumentTypes: async () => ({
            sortedDocumentTypes: {
                [SessionType.User]: { items: documentTypes },
                [SessionType.EResident]: { items: documentTypes.filter((documentType: string) => documentType.includes('e-reside')) },
            },
        }),
    })
    const userDocumentSettingsService = new UserDocumentSettingsService(identifierServiceMock, documentsServiceClientMock)

    describe('method: saveDocumentsOrder', () => {
        const { user } = testKit.session.getUserSession()
        const { identifier: userIdentifier } = user
        const params = { userIdentifier }
        const documentsOrder = [
            { order: 1, documentType: documentTypes[0] },
            { order: 2, documentType: documentTypes[1] },
        ]
        const expectedUserDocumentSettings = {
            ...Object.fromEntries(documentTypes.map((documentType) => [`${documentType}.documentTypeOrder`, -1])),
            [`${documentTypes[0]}.documentTypeOrder`]: 1,
            [`${documentTypes[1]}.documentTypeOrder`]: 2,
        }

        it('should create user document settings model when there is no one', async () => {
            jest.spyOn(identifierServiceMock, 'getSessionTypeFromIdentifier').mockReturnValueOnce(SessionType.User)
            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(undefinedValue)
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
                [`${documentTypes[0]}.documentTypeOrder`]: { documentsOrder: 1 },
                [`${documentTypes[1]}.documentTypeOrder`]: { documentsOrder: 2 },
                [`${documentTypes[2]}.documentTypeOrder`]: { documentsOrder: -1 },
                [`${documentTypes[3]}.documentTypeOrder`]: { documentsOrder: -1 },
            })
            jest.spyOn(userDocumentSettingsModel, 'updateOne').mockResolvedValueOnce(<mongo.UpdateResult>{ modifiedCount: 1 })

            await userDocumentSettingsService.saveDocumentsOrder(params, documentsOrder)

            expect(identifierServiceMock.getSessionTypeFromIdentifier).toHaveBeenCalledWith(userIdentifier)
            expect(userDocumentSettingsModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(userDocumentSettingsModel.updateOne).toHaveBeenCalledWith({ userIdentifier }, expectedUserDocumentSettings)
        })

        it.each([
            [
                'document type is not supported',
                [{ order: 1, documentType: 'unknown' }],
                new BadRequestError('Document type is not supported', { documentType: 'unknown' }),
            ],
            [
                'Invalid order number',
                [{ order: 'invalid-number', documentType: documentTypes[0] }],
                new BadRequestError('Invalid order number', { order: 'invalid-number', documentType: documentTypes[0] }),
            ],
            [
                'Duplicated order number',
                [
                    { order: 0, documentType: documentTypes[0] },
                    { order: 0, documentType: documentTypes[1] },
                ],
                new BadRequestError('Duplicated order number', { order: 0, documentType: documentTypes[1] }),
            ],
            [
                'Duplicated document type',
                [
                    { order: 0, documentType: documentTypes[0] },
                    { order: 1, documentType: documentTypes[0] },
                ],
                new BadRequestError('Duplicated document type', { order: 1, documentType: documentTypes[0] }),
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
                'user has partial document settings',
                [
                    { documentIdentifiers: ['thirdDoc', 'firstDoc', 'secondDoc'], documentType: documentTypesWithoutOfficialCert[0] },
                    { documentIdentifiers: [], documentType: documentTypesWithoutOfficialCert[1] },
                    { documentIdentifiers: ['secondDoc', 'firstDoc', 'thirdDoc'], documentType: documentTypesWithoutOfficialCert[2] },
                    ...documentTypesWithoutOfficialCert.slice(4, 5).map((documentType) => ({ documentIdentifiers: [], documentType })),
                    { documentIdentifiers: ['firstDoc', 'secondDoc', 'thirdDoc'], documentType: documentTypesWithoutOfficialCert[3] },
                    ...documentTypesWithoutOfficialCert.slice(5).map((documentType) => ({ documentIdentifiers: [], documentType })),
                ],
                new userDocumentSettingsModel({
                    [documentTypesWithoutOfficialCert[3]]: {
                        documentTypeOrder: 5,
                        documentIdentifiers: {
                            firstDoc: 2,
                            secondDoc: 4,
                            thirdDoc: 7,
                        },
                    },
                    [documentTypesWithoutOfficialCert[2]]: {
                        documentTypeOrder: 2,
                        documentIdentifiers: {
                            firstDoc: 1,
                            secondDoc: 0,
                            thirdDoc: 3,
                        },
                    },
                    [documentTypesWithoutOfficialCert[0]]: {
                        documentTypeOrder: 0,
                        documentIdentifiers: {
                            firstDoc: 1,
                            secondDoc: 3,
                            thirdDoc: 0,
                        },
                    },
                    [documentTypesWithoutOfficialCert[1]]: {
                        documentTypeOrder: 1,
                    },
                }),
            ],
            [
                'user has no document settings',
                documentTypesWithoutOfficialCert.map((documentType) => ({ documentIdentifiers: [], documentType })),
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
                documentTypesWithoutOfficialCert.map((documentType) => utils.documentTypeToCamelCase(documentType)),
            ],
            [
                `user with session type ${SessionType.EResident} has no document settings`,
                { userIdentifier: testKit.session.getEResidentSession().user.identifier },
                SessionType.EResident,
                undefined,
                ['eResidency', 'eResidentPassport'],
            ],
            [
                `user with session type ${SessionType.User} has partial document settings`,
                { userIdentifier: testKit.session.getUserSession().user.identifier },
                SessionType.User,
                new userDocumentSettingsModel({
                    [documentTypesWithoutOfficialCert[0]]: { documentTypeOrder: 0 },
                    [documentTypesWithoutOfficialCert[1]]: { documentTypeOrder: 1 },
                    [documentTypesWithoutOfficialCert[2]]: { documentTypeOrder: 2 },
                    [documentTypesWithoutOfficialCert[3]]: { documentTypeOrder: 3 },
                }),
                documentTypesWithoutOfficialCert.map((documentType) => utils.documentTypeToCamelCase(documentType)),
            ],
            [
                'user has document settings for all document types',
                { userIdentifier: testKit.session.getUserSession().user.identifier },
                SessionType.User,
                new userDocumentSettingsModel(
                    Object.fromEntries(
                        documentTypesWithoutOfficialCert.map((documentType, index) => [documentType, { documentTypeOrder: index }]),
                    ),
                ),
                documentTypesWithoutOfficialCert.map((documentType) => utils.documentTypeToCamelCase(documentType)),
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

        const defaultDocumentsSettings = Object.fromEntries(documentTypes.map((documentType) => [`${documentType}.documentTypeOrder`, -1]))

        it('should successfully save documents order by document type', async () => {
            const documentType = documentTypes[0]
            const documentsOrder = [{ order: 1, docNumber: randomUUID() }]
            const documentIdentifier = randomUUID()

            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(undefinedValue)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            jest.spyOn(userDocumentSettingsModel, 'create').mockResolvedValueOnce(<any>{})
            jest.spyOn(identifierServiceMock, 'createIdentifier').mockReturnValueOnce(documentIdentifier)
            jest.spyOn(userDocumentSettingsModel, 'updateOne').mockResolvedValueOnce(<mongo.UpdateResult>{ modifiedCount: 1 })

            await userDocumentSettingsService.saveDocumentsOrderByDocumentType({ userIdentifier }, documentType, documentsOrder)

            expect(userDocumentSettingsModel.findOne).toHaveBeenCalledWith({ userIdentifier })
            expect(userDocumentSettingsModel.create).toHaveBeenCalledWith({ userIdentifier, ...defaultDocumentsSettings })
            expect(identifierServiceMock.createIdentifier).toHaveBeenCalledWith(documentsOrder[0].docNumber)
            expect(userDocumentSettingsModel.updateOne).toHaveBeenCalledWith(
                { userIdentifier },
                {
                    $set: {
                        [`${documentTypes[0]}.documentIdentifiers`]: { [documentIdentifier]: documentsOrder[0].order },
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
            const documentType = 'document-type1'

            jest.spyOn(userDocumentSettingsModel, 'findOne').mockResolvedValueOnce(defaultDocumentsSettings)

            await expect(async () => {
                await userDocumentSettingsService.saveDocumentsOrderByDocumentType({ userIdentifier }, documentType, documentsOrder)
            }).rejects.toEqual(expectedError)
        })
    })
})
