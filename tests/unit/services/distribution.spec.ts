const distributionModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
}

jest.mock('@models/distribution', () => distributionModelMock)

import { ObjectId } from 'mongodb'

import { PlatformType } from '@diia-inhouse/types'

import DistributionService from '@services/distribution'

const distributionService = new DistributionService()
const platformTypes = Object.values(PlatformType)

describe('Service: DistributionService', () => {
    it('should create distribution with whole list of platforms', async () => {
        const messageId = new ObjectId()
        const createdDistribution = {
            _id: new ObjectId(),
        }

        const createSpy = jest.spyOn(distributionModelMock, 'create').mockResolvedValueOnce(createdDistribution)

        await expect(distributionService.createOrUpdate(messageId)).resolves.toStrictEqual([createdDistribution._id, platformTypes])

        expect(createSpy).toHaveBeenCalledWith({
            messageId,
            platformTypes: platformTypes,
        })
    })

    it('should create distribution with requested list of platforms', async () => {
        const messageId = new ObjectId()
        const createdDistribution = {
            _id: new ObjectId(),
        }
        const newPlatformTypesToSend = [PlatformType.Android, PlatformType.iOS]

        const createSpy = jest.spyOn(distributionModelMock, 'create').mockResolvedValueOnce(createdDistribution)

        await expect(distributionService.createOrUpdate(messageId, newPlatformTypesToSend)).resolves.toStrictEqual([
            createdDistribution._id,
            newPlatformTypesToSend,
        ])

        expect(createSpy).toHaveBeenCalledWith({
            messageId,
            platformTypes: newPlatformTypesToSend,
        })
    })

    it.each([
        ['with whole list of platforms', [], undefined, platformTypes],
        ['with partial list of platforms', [], [PlatformType.Android, PlatformType.iOS], [PlatformType.Android, PlatformType.iOS]],
        ['with partial list of existed platforms', [PlatformType.iOS], [PlatformType.Android], [PlatformType.Android]],
    ])('should update distribution %s', async (_message, modelPlatforms, updateListPlatforms, expectedUpdatedPlatforms) => {
        const messageId = new ObjectId()
        const saveDistributionSpy = jest.fn()

        jest.spyOn(distributionModelMock, 'findOne').mockResolvedValueOnce({
            _id: messageId,
            platformTypes: modelPlatforms,
            save: saveDistributionSpy,
        })

        await expect(distributionService.createOrUpdate(messageId, updateListPlatforms)).resolves.toStrictEqual([
            messageId,
            expectedUpdatedPlatforms,
        ])
    })
})
