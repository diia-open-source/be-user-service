import { MessageTemplateCode, NotificationAppVersionsByPlatformType, TemplateParams } from '@interfaces/services/notification'
import { UserFilter } from '@interfaces/services/userProfile'

export interface EventPayload {
    uuid: string
    request: {
        filter: UserFilter
        templateCode: MessageTemplateCode
        resourceId?: string
        templateParams?: TemplateParams
        appVersions?: NotificationAppVersionsByPlatformType
    }
}
