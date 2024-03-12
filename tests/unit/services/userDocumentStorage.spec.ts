import { CryptoService } from '@diia-inhouse/crypto'
import DiiaLogger from '@diia-inhouse/diia-logger'
import { BadRequestError } from '@diia-inhouse/errors'
import TestKit, { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

const userDocumentStorageModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    save: jest.fn(),
    modelName: 'UserDocumentStorage',
}

jest.mock('@models/userDocumentStorage', () => userDocumentStorageModel)

import UserDocumentStorageService from '@services/userDocumentStorage'

import { VaccinationCertificateType } from '@interfaces/services/userDocumentStorage'

describe(`Service ${UserDocumentStorageService.name}`, () => {
    const testKit = new TestKit()
    const cryptoService = mockInstance(CryptoService)
    const diiaLoggerService = mockInstance(DiiaLogger)

    const service = new UserDocumentStorageService(cryptoService, diiaLoggerService)

    const user = testKit.session.getUserSession().user
    const headers = testKit.session.getHeaders()

    describe(`method ${service.addDocument.name}`, () => {
        it('should create and return user document storage if not found', async () => {
            const input = {
                userIdentifier: user.identifier,
                hashData: 'hashData',
                documentType: DocumentType.DriverLicense,
                encryptedData: 'encryptedData',
            }

            jest.spyOn(userDocumentStorageModel, 'findOne').mockResolvedValueOnce(undefined)
            jest.spyOn(userDocumentStorageModel, 'create').mockResolvedValueOnce(input)

            expect(
                await service.addDocument(
                    input.userIdentifier,
                    input.hashData,
                    input.documentType,
                    input.encryptedData,
                    undefined,
                    undefined,
                    {
                        mobileUid: headers.mobileUid,
                    },
                ),
            ).toMatchObject(input)
            expect(userDocumentStorageModel.create).toHaveBeenCalledWith({
                ...input,
                mobileUid: headers.mobileUid,
                encryptedDocPhoto: undefined,
                encryptedPhoto: undefined,
            })
        })

        it('should throw BadRequestError if document already exists with different data', async () => {
            const model = {
                userIdentifier: user.identifier,
                hashData: 'hashData',
                documentType: DocumentType.DriverLicense,
                encryptedData: 'encryptedData',
            }

            jest.spyOn(userDocumentStorageModel, 'findOne').mockResolvedValueOnce(model)

            await expect(
                service.addDocument(model.userIdentifier, 'modifiedData', model.documentType, model.encryptedData, undefined, undefined, {
                    mobileUid: headers.mobileUid,
                    compareExistedHashData: true,
                }),
            ).rejects.toThrow(
                new BadRequestError('Existed document already existed with a different data', { documentType: model.documentType }),
            )
        })

        it('should save user document storage model with given data', async () => {
            const model = {
                userIdentifier: user.identifier,
                hashData: 'hashData',
                documentType: DocumentType.DriverLicense,
                encryptedData: 'encryptedData',
                save: jest.fn(),
            }

            jest.spyOn(userDocumentStorageModel, 'findOne').mockResolvedValueOnce(model)
            jest.spyOn(userDocumentStorageModel, 'save').mockResolvedValueOnce(model)

            await service.addDocument(
                model.userIdentifier,
                model.hashData,
                model.documentType,
                model.encryptedData,
                'encryptedPhoto',
                'encryptedDocPhoto',
            )

            expect(model.save).toHaveBeenCalled()
        })

        it('should create and return user document storage', async () => {
            const foundModel = {
                userIdentifier: user.identifier,
                hashData: 'prevHashData',
                documentType: DocumentType.DriverLicense,
                encryptedData: 'encryptedData',
            }

            jest.spyOn(userDocumentStorageModel, 'findOne').mockResolvedValueOnce(foundModel)

            const newModel = { ...foundModel, hashData: 'newHashData' }

            jest.spyOn(userDocumentStorageModel, 'create').mockResolvedValueOnce(newModel)

            expect(
                await service.addDocument(
                    newModel.userIdentifier,
                    newModel.hashData,
                    newModel.documentType,
                    newModel.encryptedData,
                    undefined,
                    undefined,
                    {
                        mobileUid: headers.mobileUid,
                    },
                ),
            ).toMatchObject(newModel)
            expect(userDocumentStorageModel.create).toHaveBeenCalledWith({
                ...newModel,
                mobileUid: headers.mobileUid,
                encryptedDocPhoto: undefined,
                encryptedPhoto: undefined,
            })
        })
    })

    describe(`method ${service.getEncryptedDataFromStorage.name}`, () => {
        it('should return encrypted data from storage', async () => {
            const foundModels = [
                {
                    userIdentifier: user.identifier,
                    hashData: 'hashData',
                    documentType: DocumentType.BirthCertificate,
                    encryptedData: 'encryptedData',
                },
                {
                    userIdentifier: user.identifier,
                    hashData: 'hashData',
                    documentType: DocumentType.VehicleLicense,
                    encryptedData: 'encryptedData',
                },
            ]

            const result = {
                'birth-certificate': ['encryptedData'],
                'vehicle-license': ['encryptedData'],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)

            expect(
                await service.getEncryptedDataFromStorage(user.identifier, headers.mobileUid, [
                    DocumentType.DriverLicense,
                    DocumentType.InternalPassport,
                ]),
            ).toMatchObject(result)
        })
    })

    describe(`method ${service.getDecryptedDataFromStorage.name}`, () => {
        it('should get decrypted data from storage', async () => {
            const foundModels = [
                {
                    userIdentifier: user.identifier,
                    hashData: 'hashData',
                    documentType: DocumentType.BirthCertificate,
                    encryptedData: 'encryptedData',
                    encryptedPhoto: 'encryptedPhoto',
                    encryptedDocPhoto: 'encryptedDocPhoto',
                },
            ]

            const result = {
                'birth-certificate': [{ photo: 'mocked-photo', docPhoto: 'mocked-docPhoto' }],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)

            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce({ photo: null, docPhoto: null })
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce('mocked-photo')
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce('mocked-docPhoto')

            expect(
                await service.getDecryptedDataFromStorage(user.identifier, {
                    mobileUid: headers.mobileUid,
                    documentTypes: [DocumentType.BirthCertificate],
                }),
            ).toMatchObject(result)
        })
    })

    describe(`method ${service.removeFromStorageById.name}`, () => {
        it('should return undefined if given not appropriate document type', async () => {
            expect(await service.removeFromStorageById(user.identifier, DocumentType.InternalPassport, 'docId')).toBeUndefined()
            expect(userDocumentStorageModel.find).toHaveBeenCalledTimes(0)
        })

        it('should successfully delete document from storage', async () => {
            const foundModels = [
                {
                    _id: 'docId',
                    userIdentifier: user.identifier,
                    hashData: 'hashData',
                    documentType: DocumentType.BirthCertificate,
                    encryptedData: 'encryptedData',
                    encryptedPhoto: 'encryptedPhoto',
                    encryptedDocPhoto: 'encryptedDocPhoto',
                },
            ]

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce({ id: 'docId', serie: '12345', number: 10 })
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 })

            expect(await service.removeFromStorageById(user.identifier, DocumentType.BirthCertificate, 'docId')).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith(`Found storage records: ${foundModels.length}`)
            expect(diiaLoggerService.info).toHaveBeenCalledWith(`Found storage records to remove: 1`)
            expect(diiaLoggerService.info).toHaveBeenCalledWith(`Removed storage records: 1`)
        })
    })

    describe(`method ${service.removeFromStorageByHashData.name}`, () => {
        it('should successfully remove document from storage by hash data', async () => {
            jest.spyOn(userDocumentStorageModel, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1 })

            expect(await service.removeFromStorageByHashData(user.identifier, DocumentType.BirthCertificate, 'hashData')).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user data from storage result', {
                deletedCount: 1,
                documentType: DocumentType.BirthCertificate,
            })
        })
    })

    describe(`method ${service.removeCovidCertificatesFromStorage.name}`, () => {
        it('should successfully remove covid certificates from storage', async () => {
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 })

            expect(await service.removeCovidCertificatesFromStorage(user.identifier, headers.mobileUid)).toBeUndefined()

            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user covid certificates from storage', {
                userIdentifier: user.identifier,
                mobileUid: headers.mobileUid,
                deletedCount: 1,
            })
        })
    })

    describe(`method ${service.removeCovidCertificateFromStorage.name}`, () => {
        const foundModels = [
            {
                _id: 'id',
                userIdentifier: user.identifier,
                hashData: 'hashData',
                documentType: DocumentType.BirthCertificate,
                encryptedData: 'encryptedData',
                encryptedPhoto: 'encryptedPhoto',
                encryptedDocPhoto: 'encryptedDocPhoto',
            },
        ]

        it('should successfully delete certificates with vaccination type', async () => {
            const medicalData = {
                id: 'id',
                documentType: DocumentType.BirthCertificate,
                documentIdentifier: 'certificate-id',
                vaccinations: ['vaccine'],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce(medicalData)
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 })

            expect(
                await service.removeCovidCertificateFromStorage(
                    user.identifier,
                    DocumentType.BirthCertificate,
                    headers.mobileUid,
                    [VaccinationCertificateType.Vaccination],
                    'certificate-id',
                ),
            ).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user data from storage result', {
                deletedCount: 1,
                documentType: DocumentType.BirthCertificate,
                types: [VaccinationCertificateType.Vaccination],
            })
        })

        it('should successfully delete certificates with test type', async () => {
            const medicalData = {
                id: 'id',
                documentType: DocumentType.BirthCertificate,
                documentIdentifier: 'certificate-id',
                tests: ['test'],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce(medicalData)
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 })

            expect(
                await service.removeCovidCertificateFromStorage(
                    user.identifier,
                    DocumentType.BirthCertificate,
                    headers.mobileUid,
                    [VaccinationCertificateType.Test],
                    'certificate-id',
                ),
            ).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user data from storage result', {
                deletedCount: 1,
                documentType: DocumentType.BirthCertificate,
                types: [VaccinationCertificateType.Test],
            })
        })

        it('should successfully delete certificates with recovery type', async () => {
            const medicalData = {
                id: 'id',
                documentType: DocumentType.BirthCertificate,
                documentIdentifier: 'certificate-id',
                recoveries: ['recovery'],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce(medicalData)
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 })

            expect(
                await service.removeCovidCertificateFromStorage(
                    user.identifier,
                    DocumentType.BirthCertificate,
                    headers.mobileUid,
                    [VaccinationCertificateType.Recovery],
                    'certificate-id',
                ),
            ).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user data from storage result', {
                deletedCount: 1,
                documentType: DocumentType.BirthCertificate,
                types: [VaccinationCertificateType.Recovery],
            })
        })

        it('should skip if not found document with given birth certificate id', async () => {
            const medicalData = {
                id: 'id',
                documentType: DocumentType.BirthCertificate,
                documentIdentifier: 'certificate-id',
                vaccinations: ['vaccine'],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce(medicalData)
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 0 })

            expect(
                await service.removeCovidCertificateFromStorage(
                    user.identifier,
                    DocumentType.BirthCertificate,
                    headers.mobileUid,
                    [VaccinationCertificateType.Vaccination],
                    'wrong-certificate-id',
                ),
            ).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user data from storage result', {
                deletedCount: 0,
                documentType: DocumentType.BirthCertificate,
                types: [VaccinationCertificateType.Vaccination],
            })
        })

        it('should skip if given wrong vaccination certificate type', async () => {
            const medicalData = {
                id: 'id',
                documentType: DocumentType.BirthCertificate,
                documentIdentifier: 'certificate-id',
                vaccinations: ['vaccine'],
            }

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce(medicalData)
            jest.spyOn(userDocumentStorageModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 0 })

            expect(
                await service.removeCovidCertificateFromStorage(
                    user.identifier,
                    DocumentType.BirthCertificate,
                    headers.mobileUid,
                    [<VaccinationCertificateType>'wrong-type'],
                    'certificate-id',
                ),
            ).toBeUndefined()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Remove user data from storage result', {
                deletedCount: 0,
                documentType: DocumentType.BirthCertificate,
                types: [<VaccinationCertificateType>'wrong-type'],
            })
        })
    })

    describe(`method ${service.hasStorageDocument.name}`, () => {
        it('should return true if document in storage', async () => {
            const foundModels = [
                {
                    id: 'doc-id',
                    userIdentifier: user.identifier,
                    hashData: 'hashData',
                    documentType: DocumentType.BirthCertificate,
                    encryptedData: 'encryptedData',
                    encryptedPhoto: 'encryptedPhoto',
                    encryptedDocPhoto: 'encryptedDocPhoto',
                },
            ]

            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce(foundModels)

            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce({ id: 'doc-id', photo: null, docPhoto: null })
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce('mocked-photo')
            jest.spyOn(cryptoService, 'decryptData').mockResolvedValueOnce('mocked-docPhoto')

            expect(
                await service.hasStorageDocument(user.identifier, headers.mobileUid, DocumentType.BirthCertificate, 'doc-id'),
            ).toBeTruthy()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Document already exists in storage', {
                id: 'doc-id',
                documentType: DocumentType.BirthCertificate,
            })
        })

        it('should return false if document not found in storage', async () => {
            jest.spyOn(userDocumentStorageModel, 'find').mockResolvedValueOnce([])

            expect(
                await service.hasStorageDocument(user.identifier, headers.mobileUid, DocumentType.BirthCertificate, 'doc-id'),
            ).toBeFalsy()
            expect(diiaLoggerService.info).toHaveBeenCalledWith('Not found document in storage', {
                id: 'doc-id',
                documentType: DocumentType.BirthCertificate,
            })
        })
    })
})
