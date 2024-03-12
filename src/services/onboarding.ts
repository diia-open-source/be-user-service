import { compare as compareSemver } from 'compare-versions'
import { FilterQuery } from 'mongoose'

import { PlatformType, SessionType } from '@diia-inhouse/types'

import newFeaturesModel from '@models/newFeatures'
import onboardingModel from '@models/onboarding'
import userNewFeaturesModel from '@models/userNewFeatures'
import userOnboardingModel from '@models/userOnboarding'

import { NewFeatures, NewFeaturesModel } from '@interfaces/models/newFeatures'
import { Onboarding, OnboardingModel } from '@interfaces/models/onboarding'
import { UserNewFeaturesModel } from '@interfaces/models/userNewFeatures'
import { UserOnboardingModel } from '@interfaces/models/userOnboarding'
import { OnboardingInfo } from '@interfaces/services/onboarding'

export default class OnboardingService {
    private cachedOnboardingsByPlatformType: Record<PlatformType, OnboardingModel[]> | undefined

    private cachedNewFeaturesByPlatformType: Record<PlatformType, NewFeaturesModel[]> | undefined

    async getFeatures(
        mobileUid: string,
        appVersion: string,
        platformType: PlatformType,
        sessionType: SessionType = SessionType.User,
    ): Promise<OnboardingInfo> {
        const onboardingQuery: FilterQuery<UserOnboardingModel> = { mobileUid }
        const newFeaturesQuery: FilterQuery<UserNewFeaturesModel> = { mobileUid }
        const [existedUserOnboarding, existedUserFeatures] = await Promise.all([
            userOnboardingModel.findOne(onboardingQuery),
            userNewFeaturesModel.findOne(newFeaturesQuery),
        ])

        if (!existedUserOnboarding) {
            const onboarding: Onboarding = await this.getOnboardingByAppVersion(appVersion, platformType, sessionType)

            if (!onboarding) {
                await userOnboardingModel.create({ mobileUid, onboardingAppVersion: '0.0.0' })

                return {}
            }

            await userOnboardingModel.create({ mobileUid, onboardingAppVersion: onboarding.appVersion })

            return { features: onboarding.data }
        }

        const newFeatures: NewFeatures = await this.getNewFeaturesByAppVersion(appVersion, platformType, sessionType)

        if (!newFeatures) {
            return {}
        }

        if (!existedUserFeatures) {
            if (compareSemver(newFeatures.appVersion, existedUserOnboarding.onboardingAppVersion, '<=')) {
                return {}
            }

            await userNewFeaturesModel.create({ mobileUid, featuresAppVersion: newFeatures.appVersion, viewsCounter: 1 })

            return { features: newFeatures.data }
        }

        if (existedUserFeatures.featuresAppVersion === newFeatures.appVersion) {
            if (existedUserFeatures.viewsCounter >= newFeatures.viewsCount) {
                return {}
            }

            existedUserFeatures.viewsCounter += 1
            await existedUserFeatures.save()

            return { features: newFeatures.data }
        }

        if (compareSemver(newFeatures.appVersion, existedUserFeatures.featuresAppVersion, '>')) {
            existedUserFeatures.featuresAppVersion = newFeatures.appVersion
            existedUserFeatures.viewsCounter = 1

            await existedUserFeatures.save()

            return { features: newFeatures.data }
        }

        return {}
    }

    private async getOnboardingByAppVersion(appVersion: string, platformType: PlatformType, sessionType: SessionType): Promise<Onboarding> {
        const onboardings: OnboardingModel[] = await this.getOnboardingsByPlatformType(platformType, sessionType)

        let indx: number = onboardings.length - 1
        while (onboardings[indx]?.isVisible && compareSemver(appVersion, onboardings[indx].appVersion, '<')) {
            indx -= 1
        }

        return <Onboarding>onboardings[indx]?.toObject()
    }

    private async getOnboardingsByPlatformType(platformType: PlatformType, sessionType: SessionType): Promise<OnboardingModel[]> {
        if (this.cachedOnboardingsByPlatformType) {
            return this.cachedOnboardingsByPlatformType[platformType]
        }

        const onboardings = await onboardingModel.find({ sessionType })

        this.cachedOnboardingsByPlatformType = {
            [PlatformType.Android]: [],
            [PlatformType.Huawei]: [],
            [PlatformType.iOS]: [],
            [PlatformType.Browser]: [],
        }

        onboardings.forEach((item) => {
            this.cachedOnboardingsByPlatformType![item.platformType].push(item)
        })
        Object.values(PlatformType).forEach((type) => {
            this.cachedOnboardingsByPlatformType![type] = this.cachedOnboardingsByPlatformType![type].sort(
                (a: OnboardingModel, b: OnboardingModel) => (compareSemver(a.appVersion, b.appVersion, '>') ? 1 : -1),
            )
        })

        return this.cachedOnboardingsByPlatformType[platformType]
    }

    private async getNewFeaturesByAppVersion(
        appVersion: string,
        platformType: PlatformType,
        sessionType: SessionType,
    ): Promise<NewFeatures> {
        const newFeatures: NewFeaturesModel[] = await this.getNewFeaturesByPlatformType(platformType, sessionType)

        let indx: number = newFeatures.length - 1
        while (newFeatures[indx]?.isVisible && compareSemver(appVersion, newFeatures[indx].appVersion, '<')) {
            indx -= 1
        }

        return <NewFeatures>newFeatures[indx]?.toObject()
    }

    private async getNewFeaturesByPlatformType(platformType: PlatformType, sessionType: SessionType): Promise<NewFeaturesModel[]> {
        if (this.cachedNewFeaturesByPlatformType) {
            return this.cachedNewFeaturesByPlatformType[platformType]
        }

        const newFeatures = await newFeaturesModel.find({ sessionType })

        this.cachedNewFeaturesByPlatformType = {
            [PlatformType.Android]: [],
            [PlatformType.Huawei]: [],
            [PlatformType.iOS]: [],
            [PlatformType.Browser]: [],
        }

        newFeatures.forEach((item) => {
            this.cachedNewFeaturesByPlatformType![item.platformType].push(item)
        })
        Object.values(PlatformType).forEach((type) => {
            this.cachedNewFeaturesByPlatformType![type] = this.cachedNewFeaturesByPlatformType![type].sort(
                (a: NewFeaturesModel, b: NewFeaturesModel) => (compareSemver(a.appVersion, b.appVersion, '>') ? 1 : -1),
            )
        })

        return this.cachedNewFeaturesByPlatformType[platformType]
    }
}
