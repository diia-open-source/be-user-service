const compareSemverStub = jest.fn()

jest.mock('compare-versions', () => ({ compare: compareSemverStub }))

import TestKit from '@diia-inhouse/test'
import { PlatformType, SessionType } from '@diia-inhouse/types'

import OnboardingService from '@services/onboarding'

import newFeaturesModel from '@models/newFeatures'
import onboardingModel from '@models/onboarding'
import userNewFeaturesModel from '@models/userNewFeatures'
import userOnboardingModel from '@models/userOnboarding'

describe('OnboardingService', () => {
    const testKit = new TestKit()
    const onboardingService = new OnboardingService()

    describe('method: `getFeatures`', () => {
        const { mobileUid, appVersion, platformType } = testKit.session.getHeaders()
        const { sessionType } = testKit.session.getUserSession()
        const onboardings = [
            {
                appVersion: '1.0.0',
                platformType: PlatformType.Android,
                isVisible: true,
                sessionType: SessionType.User,
                data: { header: { logo: 'logo' }, boards: [] },
                toObject: function (): unknown {
                    return this
                },
            },
            {
                appVersion: '1.0.0',
                platformType: PlatformType.iOS,
                isVisible: true,
                sessionType: SessionType.User,
                data: { header: { logo: 'logo' }, boards: [] },
                toObject: function (): unknown {
                    return this
                },
            },
            {
                appVersion: '1.0.0',
                platformType: PlatformType.Huawei,
                isVisible: true,
                sessionType: SessionType.User,
                data: { header: { logo: 'logo' }, boards: [] },
                toObject: function (): unknown {
                    return this
                },
            },
        ]
        const newFeatures = onboardings.map((onboarding: object) => ({ ...onboarding, viewsCount: 1 }))

        it('should successfully create user onboarding for 0.0.0 app version in case onboarding for provided app version not found', async () => {
            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(onboardingModel, 'find').mockResolvedValueOnce(onboardings)
            compareSemverStub.mockReturnValue(true)
            jest.spyOn(userOnboardingModel, 'create').mockResolvedValueOnce([new userOnboardingModel()])

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({})

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(onboardingModel.find).toHaveBeenCalledWith({ sessionType })
            expect(userOnboardingModel.create).toHaveBeenCalledWith({ mobileUid, onboardingAppVersion: '0.0.0' })
        })

        it('should successfully create user onboarding for selected onboarding app version', async () => {
            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(onboardingModel, 'find').mockResolvedValueOnce(onboardings)
            compareSemverStub.mockReturnValueOnce(false)
            jest.spyOn(userOnboardingModel, 'create').mockResolvedValueOnce([new userOnboardingModel()])

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({
                features: { header: { logo: 'logo' }, boards: [] },
            })

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userOnboardingModel.create).toHaveBeenCalledWith({ mobileUid, onboardingAppVersion: '1.0.0' })
        })

        it('should return empty features list in case there are no new features', async () => {
            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce(new userOnboardingModel())
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            compareSemverStub.mockReturnValueOnce(true)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({})

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(newFeaturesModel.find).toHaveBeenCalledWith({ sessionType })
        })

        it('should return empty features list in case there are no existed user features and existed user onboarding app version is <= to new features app version', async () => {
            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce({ onboardingAppVersion: '1.0.0' })
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(true)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({})

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
        })

        it('should return new feature data in case there are no existed user features and existed user onboarding app version is not <= to new features app version', async () => {
            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce({ onboardingAppVersion: '1.0.0' })
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            jest.spyOn(userNewFeaturesModel, 'create').mockResolvedValueOnce([])
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(false)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({
                features: { header: { logo: 'logo' }, boards: [] },
            })

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.create).toHaveBeenCalledWith({
                mobileUid,
                featuresAppVersion: '1.0.0',
                viewsCounter: 1,
            })
        })

        it('should return empty feature data in case there are existing user features and new features app version is equal to new features app version and views count is exceeded', async () => {
            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce({ onboardingAppVersion: '1.0.0' })
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce({ featuresAppVersion: '1.0.0', viewsCounter: 1 })
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(false)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({})

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
        })

        it('should increment user features views counter and return new feature data', async () => {
            const validUserNewFeaturesModel = new userNewFeaturesModel({ mobileUid, featuresAppVersion: '1.0.0', viewsCounter: 0 })

            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce({ onboardingAppVersion: '1.0.0' })
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(validUserNewFeaturesModel)
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            jest.spyOn(validUserNewFeaturesModel, 'save').mockResolvedValueOnce(validUserNewFeaturesModel)
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(false)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({
                features: { header: { logo: 'logo' }, boards: [] },
            })

            expect(validUserNewFeaturesModel.viewsCounter).toBe(1)
            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(validUserNewFeaturesModel.save).toHaveBeenCalledWith()
        })

        it('should set user features views counter to 1 and return new feature data in case versions are not equal', async () => {
            const validUserNewFeaturesModel = new userNewFeaturesModel({ mobileUid, featuresAppVersion: '1.0.1', viewsCounter: 0 })

            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce({ onboardingAppVersion: '1.0.0' })
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(validUserNewFeaturesModel)
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            jest.spyOn(validUserNewFeaturesModel, 'save').mockResolvedValueOnce(validUserNewFeaturesModel)
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(true)
            compareSemverStub.mockReturnValueOnce(true)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({
                features: { header: { logo: 'logo' }, boards: [] },
            })

            expect(validUserNewFeaturesModel.viewsCounter).toBe(1)
            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(validUserNewFeaturesModel.save).toHaveBeenCalledWith()
        })

        it('should return empty feature data in case versions are not equal and existed user features app version is greater new features app version', async () => {
            const validUserNewFeaturesModel = new userNewFeaturesModel({ mobileUid, featuresAppVersion: '1.0.1', viewsCounter: 0 })

            jest.spyOn(userOnboardingModel, 'findOne').mockResolvedValueOnce({ onboardingAppVersion: '1.0.0' })
            jest.spyOn(userNewFeaturesModel, 'findOne').mockResolvedValueOnce(validUserNewFeaturesModel)
            jest.spyOn(newFeaturesModel, 'find').mockResolvedValueOnce(newFeatures)
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(false)
            compareSemverStub.mockReturnValueOnce(false)

            expect(await onboardingService.getFeatures(mobileUid, appVersion, platformType, sessionType)).toEqual({})

            expect(userOnboardingModel.findOne).toHaveBeenCalledWith({ mobileUid })
            expect(userNewFeaturesModel.findOne).toHaveBeenCalledWith({ mobileUid })
        })
    })
})
