import { StoreService } from '@diia-inhouse/redis'

import UserActionAccessSettingService from '@services/userActionAccessSetting'

import { ActionAccessType } from '@interfaces/services/userActionAccess'

export default class UserActionAccessService {
    constructor(
        private readonly store: StoreService,

        private readonly userActionAccessSettingService: UserActionAccessSettingService,
    ) {}

    async hasActionAccess(userIdentifier: string, actionAccessType: ActionAccessType): Promise<boolean> {
        const [userActionAccessSetting, userActionAccessCount] = await Promise.all([
            this.userActionAccessSettingService.getSetting(actionAccessType),
            this.getUserActionAccessCount(userIdentifier, actionAccessType),
        ])

        return userActionAccessSetting.maxValue > userActionAccessCount
    }

    async increaseCounterActionAccess(userIdentifier: string, actionAccessType: ActionAccessType): Promise<void> {
        const [userActionAccessSetting, currentUserActionAccessCount] = await Promise.all([
            this.userActionAccessSettingService.getSetting(actionAccessType),
            this.getUserActionAccessCount(userIdentifier, actionAccessType),
        ])

        const newUserActionAccessCountValue = currentUserActionAccessCount + 1

        await this.setUserActionAccessCount(
            userIdentifier,
            actionAccessType,
            newUserActionAccessCountValue,
            userActionAccessSetting.expirationTime,
        )
    }

    async nullifyCounterActionAccess(userIdentifier: string, actionAccessType: ActionAccessType): Promise<void> {
        const storeKey = this.getStoreKey(userIdentifier, actionAccessType)

        await this.store.remove(storeKey)
    }

    private async getUserActionAccessCount(userIdentifier: string, actionAccessType: ActionAccessType): Promise<number> {
        const storeKey = this.getStoreKey(userIdentifier, actionAccessType)
        const actionAccessCount = await this.store.get(storeKey)

        return actionAccessCount ? parseInt(actionAccessCount, 10) : 0
    }

    private async setUserActionAccessCount(
        userIdentifier: string,
        actionAccessType: ActionAccessType,
        value: number,
        secTtl: number,
    ): Promise<void> {
        const storeKey = this.getStoreKey(userIdentifier, actionAccessType)

        await this.store.set(storeKey, String(value), { ttl: secTtl * 1000 })
    }

    private getStoreKey(userIdentifier: string, actionAccessType: ActionAccessType): string {
        const redisUserActionAccessPrefix = 'user-action-access'

        return `${redisUserActionAccessPrefix}:${userIdentifier}:${actionAccessType}`
    }
}
