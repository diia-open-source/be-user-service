import { NotificationAppVersionsByPlatformType } from '@interfaces/services/notification'
import { UserFilter } from '@interfaces/services/userProfile'

export interface EventPayload {
    uuid: string
    request: {
        filter: UserFilter
        channel: string
        topicsBatch?: number
        campaignId?: string
        appVersions?: NotificationAppVersionsByPlatformType
    }
}
