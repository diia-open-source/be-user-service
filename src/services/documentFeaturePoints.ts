import { v4 as uuid } from 'uuid'

import { FilterQuery, UpdateQuery } from '@diia-inhouse/db'
import { ExternalCommunicator } from '@diia-inhouse/diia-queue'
import { ModelNotFoundError, ServiceUnavailableError } from '@diia-inhouse/errors'
import { Logger } from '@diia-inhouse/types'

import documentFeaturePointsModel from '@models/documentFeaturePoints'

import DocumentFeaturePointsDataMapper from '@dataMappers/documentFeaturePointsDataMapper'

import { DocumentFeaturePointsModel } from '@interfaces/models/documentFeaturePoints'
import { ExternalEvent } from '@interfaces/queue'
import { CheckPointsResult, FeaturePointResponse, GetPointsResult } from '@interfaces/services/documentFeaturePoints'

export default class DocumentFeaturePointsService {
    constructor(
        private readonly documentFeaturePointsDataMapper: DocumentFeaturePointsDataMapper,

        private readonly external: ExternalCommunicator,
        private readonly logger: Logger,
    ) {}

    async checkDocumentsFeaturePoints(userIdentifier: string): Promise<CheckPointsResult[]> {
        const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, 'points.0': { $exists: true } }
        const result: Omit<DocumentFeaturePointsModel, 'points'>[] = await documentFeaturePointsModel.find(query, { points: 0 })

        return result.map((item: Omit<DocumentFeaturePointsModel, 'points'>) => this.documentFeaturePointsDataMapper.toCheckResult(item))
    }

    async createDocumentFeaturePoints(
        userIdentifier: string | undefined,
        documentType: string,
        documentIdentifier: string,
        photo: string,
    ): Promise<number[]> {
        const featurePoints = await this.external.receive<FeaturePointResponse>(ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints, {
            photoBase64: photo,
        })
        if (!featurePoints) {
            throw new ServiceUnavailableError('No feature points response')
        }

        if (userIdentifier) {
            const requestId = uuid()

            const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, documentType, documentIdentifier }
            const modifier: UpdateQuery<DocumentFeaturePointsModel> = { requestId, points: featurePoints.feature_points }

            await documentFeaturePointsModel.updateOne(query, modifier, { upsert: true })
        }

        return featurePoints.feature_points
    }

    async createDocumentFeaturePointsEntity(
        userIdentifier: string,
        documentType: string,
        documentIdentifier: string,
        photo: string,
    ): Promise<void> {
        const requestId: string = uuid()
        const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, documentType, documentIdentifier }
        const modifier: UpdateQuery<DocumentFeaturePointsModel> = { requestId }

        await documentFeaturePointsModel.updateOne(query, modifier, { upsert: true })

        await this.external.receive(
            ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints,
            { photoBase64: photo },
            { requestUuid: requestId, async: true },
        )
    }

    async attachFeaturePoints(requestId: string, points: number[]): Promise<void> {
        const query: FilterQuery<DocumentFeaturePointsModel> = { requestId }
        const modifier: UpdateQuery<DocumentFeaturePointsModel> = { points }

        try {
            const doc = await documentFeaturePointsModel.findOneAndUpdate(query, modifier)
            if (!doc) {
                throw new ModelNotFoundError(documentFeaturePointsModel.modelName, requestId)
            }
        } catch (err) {
            this.logger.fatal(`Failed to update document feature point model by requestId: [${requestId}]`, { err })
        }
    }

    async removeDocumentFeaturePoints(userIdentifier: string, documentType: string, documentIdentifier: string): Promise<void> {
        const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, documentType, documentIdentifier }

        await documentFeaturePointsModel.deleteOne(query)
    }

    async areFeaturePointsExistByUserIdentifier(userIdentifier: string): Promise<boolean> {
        const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, 'points.0': { $exists: true } }
        const count: number = await documentFeaturePointsModel.countDocuments(query)

        return count > 0
    }

    async getFeaturePoints(userIdentifier: string): Promise<GetPointsResult[]> {
        const query: FilterQuery<DocumentFeaturePointsModel> = { userIdentifier, 'points.0': { $exists: true } }
        const documents: DocumentFeaturePointsModel[] = await documentFeaturePointsModel.find(query)

        return documents.map((item: DocumentFeaturePointsModel) => this.documentFeaturePointsDataMapper.toGetResult(item))
    }
}
