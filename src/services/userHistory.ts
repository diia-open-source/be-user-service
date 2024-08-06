import AuthService from '@services/auth'
import UserSharingHistoryService from '@services/userSharingHistory'
import UserSigningHistoryService from '@services/userSigningHistory'

import UserHistoryDataMapper from '@dataMappers/userHistoryDataMapper'

import {
    HistoryAction,
    HistoryItemResponse,
    HistoryResponse,
    HistoryResponseByCode,
    HistoryResponseByCodeV1,
    HistoryScreenResponse,
    HistoryScreenResponseV1,
    UserHistoryCode,
} from '@interfaces/services/userHistory'

export default class UserHistoryService {
    constructor(
        private readonly userSharingHistoryService: UserSharingHistoryService,
        private readonly userSigningHistoryService: UserSigningHistoryService,
        private readonly userHistoryDataMapper: UserHistoryDataMapper,
        private readonly authService: AuthService,
    ) {}

    async getHistoryByAction(
        action: HistoryAction,
        userIdentifier: string,
        sessionId: string | undefined,
        skip: number,
        limit: number,
    ): Promise<HistoryResponse> {
        switch (action) {
            case HistoryAction.Sharing: {
                return await this.userSharingHistoryService.getHistory(userIdentifier, sessionId, skip, limit)
            }
            case HistoryAction.Signing: {
                return await this.userSigningHistoryService.getHistory(userIdentifier, sessionId, skip, limit)
            }
            default: {
                const unhandledAction: never = action

                throw new TypeError(`Unhandled action: ${unhandledAction}`)
            }
        }
    }

    async getHistoryItemsV1(
        action: UserHistoryCode,
        userIdentifier: string,
        skip: number,
        limit: number,
    ): Promise<HistoryResponseByCodeV1> {
        const response = await this.userSigningHistoryService.getSigningHistoryByActionV1(action, userIdentifier, skip, limit)
        const { total } = response
        if (total === 0) {
            const stubMessage = this.userHistoryDataMapper.getStubMessageByActionV1(action)

            return { stubMessage, items: [], total }
        }

        return response
    }

    async getHistoryItems(
        action: UserHistoryCode,
        userIdentifier: string,
        skip: number,
        limit: number,
        sessionId?: string,
    ): Promise<HistoryResponseByCode> {
        const response =
            action === UserHistoryCode.Sharing
                ? await this.userSharingHistoryService.getSharingHistoryByAction(action, userIdentifier, skip, limit, sessionId)
                : await this.userSigningHistoryService.getSigningHistoryByAction(action, userIdentifier, skip, limit, sessionId)

        const { total } = response

        if (total === 0) {
            const stubMessageMlc = this.userHistoryDataMapper.getStubMessageByAction(action)

            return {
                body: [{ stubMessageMlc }],
                total: 0,
            }
        }

        return response
    }

    async getHistoryScreenV1(userIdentifier: string): Promise<HistoryScreenResponseV1> {
        const { authorization, signing } = await this.userSigningHistoryService.getHistoryScreenCounts(userIdentifier)

        return {
            navigationPanel: this.userHistoryDataMapper.getHistoryScreenNavigationPanel(),
            tabs: {
                items: [
                    {
                        code: UserHistoryCode.Authorization,
                        name: 'Авторизації',
                        count: authorization,
                    },
                    {
                        code: UserHistoryCode.Signing,
                        name: 'Підписання',
                        count: signing,
                    },
                ],
                preselectedCode: UserHistoryCode.Authorization,
            },
        }
    }

    async getHistoryScreen(userIdentifier: string, sessionId?: string): Promise<HistoryScreenResponse> {
        const [{ authorization, signing }, sharing, navigationPanelLabel] = await Promise.all([
            this.userSigningHistoryService.getHistoryScreenCounts(userIdentifier, sessionId),
            this.userSharingHistoryService.countHistory(userIdentifier, sessionId),
            sessionId && this.getSessionNavigationPanelLabel(userIdentifier, sessionId),
        ])

        return {
            topGroup: [
                {
                    topGroupOrg: {
                        navigationPanelMlc: this.userHistoryDataMapper.getHistoryScreenNavigationPanelMlc(navigationPanelLabel),
                        chipTabsOrg: {
                            items: [
                                {
                                    chipMlc: {
                                        code: UserHistoryCode.Authorization,
                                        label: 'Авторизації',
                                        badgeCounterAtm: {
                                            count: authorization,
                                        },
                                    },
                                },
                                {
                                    chipMlc: {
                                        code: UserHistoryCode.Signing,
                                        label: 'Підписання',
                                        badgeCounterAtm: {
                                            count: signing,
                                        },
                                    },
                                },
                                {
                                    chipMlc: {
                                        code: UserHistoryCode.Sharing,
                                        label: 'Копії документів',
                                        badgeCounterAtm: {
                                            count: sharing,
                                        },
                                    },
                                },
                            ],
                            preselectedCode: UserHistoryCode.Authorization,
                        },
                    },
                },
            ],
        }
    }

    async countHistoryByAction(action: HistoryAction, userIdentifier: string, sessionId: string | undefined): Promise<number> {
        switch (action) {
            case HistoryAction.Sharing: {
                return await this.userSharingHistoryService.countHistory(userIdentifier, sessionId)
            }
            case HistoryAction.Signing: {
                return await this.userSigningHistoryService.countHistory(userIdentifier, sessionId)
            }
            default: {
                const unhandledAction: never = action

                throw new TypeError(`Unhandled action: ${unhandledAction}`)
            }
        }
    }

    async getHistoryItemById(
        userIdentifier: string,
        itemId: string,
        action: UserHistoryCode,
        sessionId?: string,
    ): Promise<HistoryItemResponse> {
        const navigationPanelLabel = sessionId && (await this.getSessionNavigationPanelLabel(userIdentifier, sessionId))

        if (action === UserHistoryCode.Sharing) {
            return await this.userSharingHistoryService.getSharingHistoryItemById(
                itemId,
                userIdentifier,
                action,
                navigationPanelLabel,
                sessionId,
            )
        }

        return await this.userSigningHistoryService.getSigningHistoryItemById(
            itemId,
            userIdentifier,
            action,
            navigationPanelLabel,
            sessionId,
        )
    }

    async getSessionNavigationPanelLabel(userIdentifier: string, sessionId: string): Promise<string> {
        const session = await this.authService.getSessionById(sessionId, userIdentifier)

        const { platformType, platformVersion } = session

        return `${platformType} ${platformVersion}`
    }
}
