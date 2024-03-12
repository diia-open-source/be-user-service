import { randomUUID } from 'crypto'

import { FilterQuery, UpdateQuery } from 'mongoose'

const uuidV4Stub = jest.fn()

jest.mock('uuid', () => ({ v4: uuidV4Stub }))

import DiiaLogger from '@diia-inhouse/diia-logger'
import { ExternalCommunicator, ExternalEvent } from '@diia-inhouse/diia-queue'
import { ModelNotFoundError } from '@diia-inhouse/errors'
import { mockInstance } from '@diia-inhouse/test'
import { DocumentType } from '@diia-inhouse/types'

const documentFeaturePointsModel = {
    find: jest.fn(),
    updateOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    modelName: 'DocumentFeaturePoints',
}

jest.mock('@models/documentFeaturePoints', () => documentFeaturePointsModel)

import DocumentFeaturePointsService from '@services/documentFeaturePoints'

import DocumentFeaturePointsDataMapper from '@dataMappers/documentFeaturePointsDataMapper'

import { DocumentFeaturePointsModel } from '@interfaces/models/documentFeaturePoints'

describe(`Service ${DocumentFeaturePointsService.name}`, () => {
    const documentFeaturePointsDataMapper = new DocumentFeaturePointsDataMapper()
    const loggerMock = mockInstance(DiiaLogger)
    const mockExternalCommunicator = mockInstance(ExternalCommunicator)

    const documentFeaturePointsService = new DocumentFeaturePointsService(
        documentFeaturePointsDataMapper,
        mockExternalCommunicator,
        loggerMock,
    )

    const userIdentifier = 'userIdentifier'

    describe('method: `checkDocumentsFeaturePoints`', () => {
        it('should return check point result', async () => {
            const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, 'points.0': { $exists: true } }

            const result = [
                {
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifier: 'documentIdentifier',
                },
            ]

            const documentFeaturePoints = [
                {
                    userIdentifier: 'userIdentifier',
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifier: 'documentIdentifier',
                    requestId: 'requestId',
                },
            ]

            jest.spyOn(documentFeaturePointsModel, 'find').mockResolvedValueOnce(documentFeaturePoints)

            expect(await documentFeaturePointsService.checkDocumentsFeaturePoints(userIdentifier)).toMatchObject(result)
            expect(documentFeaturePointsModel.find).toHaveBeenCalledWith(query, { points: 0 })
        })
    })

    describe('method: `createDocumentFeaturePoints`', () => {
        it('should return array of feature pointsm', async () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const feature_points = [10, 10]
            const documentType = DocumentType.BirthCertificate
            const documentIdentifier = 'documentIdentifier'
            const photo = 'photo'

            jest.spyOn(mockExternalCommunicator, 'receive').mockResolvedValueOnce({ feature_points })
            jest.spyOn(documentFeaturePointsModel, 'updateOne').mockResolvedValueOnce(true)

            expect(
                await documentFeaturePointsService.createDocumentFeaturePoints(userIdentifier, documentType, documentIdentifier, photo),
            ).toMatchObject(feature_points)
            expect(mockExternalCommunicator.receive).toHaveBeenCalledWith(ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints, {
                photoBase64: photo,
            })
        })
    })

    describe('method: `createDocumentFeaturePointsEntity`', () => {
        it('should successfully create document feature points entity', async () => {
            const documentType = DocumentType.BirthCertificate
            const documentIdentifier = 'documentIdentifier'
            const photo = 'photo'

            const requestUuid = randomUUID()

            uuidV4Stub.mockReturnValueOnce(requestUuid)

            const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, documentType, documentIdentifier }
            const modifier: UpdateQuery<DocumentFeaturePointsModel> = { requestId: requestUuid }

            jest.spyOn(documentFeaturePointsModel, 'updateOne').mockResolvedValueOnce(true)
            jest.spyOn(mockExternalCommunicator, 'receive').mockResolvedValueOnce(true)

            await documentFeaturePointsService.createDocumentFeaturePointsEntity(userIdentifier, documentType, documentIdentifier, photo)

            expect(documentFeaturePointsModel.updateOne).toHaveBeenCalledWith(query, modifier, { upsert: true })
            expect(mockExternalCommunicator.receive).toHaveBeenCalledWith(
                ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints,
                { photoBase64: photo },
                { requestUuid: requestUuid, async: true },
            )
        })
    })

    describe('method: `attachFeaturePoints`', () => {
        const requestId = 'requestId'
        const points = [10, 10]

        it('should throw ModelNotFoundError if document not found', async () => {
            const err = new ModelNotFoundError(documentFeaturePointsModel.modelName, requestId)

            jest.spyOn(documentFeaturePointsModel, 'findOneAndUpdate').mockResolvedValueOnce(undefined)

            await documentFeaturePointsService.attachFeaturePoints(requestId, points)

            expect(loggerMock.fatal).toHaveBeenCalledWith(`Failed to update document feature point model by requestId: [${requestId}]`, {
                err,
            })
        })

        it('should successfully attach feature points', async () => {
            const query: FilterQuery<DocumentFeaturePointsModel> = { requestId }
            const modifier: UpdateQuery<DocumentFeaturePointsModel> = { points }

            jest.spyOn(documentFeaturePointsModel, 'findOneAndUpdate').mockResolvedValueOnce(<DocumentFeaturePointsModel>{
                userIdentifier,
                documentType: DocumentType.BirthCertificate,
                documentIdentifier: 'documentIdentifier',
                requestId,
            })

            await documentFeaturePointsService.attachFeaturePoints(requestId, points)

            expect(documentFeaturePointsModel.findOneAndUpdate).toHaveBeenCalledWith(query, modifier)
        })
    })

    describe('method: `removeDocumentFeaturePoints`', () => {
        it('should successfully remove document feature points', async () => {
            const documentType = DocumentType.BirthCertificate
            const documentIdentifier = 'documentIdentifier'

            const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, documentType, documentIdentifier }

            jest.spyOn(documentFeaturePointsModel, 'deleteOne').mockResolvedValueOnce(true)

            await documentFeaturePointsService.removeDocumentFeaturePoints(userIdentifier, documentType, documentIdentifier)

            expect(documentFeaturePointsModel.deleteOne).toHaveBeenCalledWith(query)
        })
    })

    describe('method: `areFeaturePointsExistByUserIdentifier`', () => {
        it('should return true if count of feature points more than 0', async () => {
            const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, 'points.0': { $exists: true } }

            jest.spyOn(documentFeaturePointsModel, 'countDocuments').mockResolvedValueOnce(1)

            expect(await documentFeaturePointsService.areFeaturePointsExistByUserIdentifier(userIdentifier)).toBeTruthy()

            expect(documentFeaturePointsModel.countDocuments).toHaveBeenCalledWith(query)
        })
    })

    describe('method: `getFeaturePoints`', () => {
        it('should return get Points result', async () => {
            const documentFeaturePoints = [
                {
                    userIdentifier: 'userIdentifier',
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifier: 'documentIdentifier',
                    requestId: 'requestId',
                    points: [10, 10],
                },
            ]

            const result = [
                {
                    documentType: DocumentType.BirthCertificate,
                    documentIdentifier: 'documentIdentifier',
                    points: [10, 10],
                },
            ]

            const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, 'points.0': { $exists: true } }

            jest.spyOn(documentFeaturePointsModel, 'find').mockResolvedValueOnce(documentFeaturePoints)

            expect(await documentFeaturePointsService.getFeaturePoints(userIdentifier)).toMatchObject(result)

            expect(documentFeaturePointsModel.find).toHaveBeenCalledWith(query)
        })
    })
})
