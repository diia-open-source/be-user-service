import { PlatformType } from '@diia-inhouse/types'

export enum ResourceType {
    Penalty = 'penalty',
    Debt = 'debt',
    SocialAssistance = 'social-assistance',
}

export enum SmsTemplateCode {
    Otp = 'otp',
}

export enum TemplateStub {
    ApplicationId = 'APPLICATION_ID',
    ServiceCenterName = 'SERVICE_CENTER_NAME',
    Reason = 'REASON',
    Address = 'ADDRESS',
    PhoneNumber = 'PHONE_NUMBER',
    FullName = 'FULL_NAME',
    OrderNum = 'ORDER_NUM',
    BrandModel = 'BRAND_MODEL',
    LicensePlate = 'LICENSE_PLATE',
}

export enum MessageTemplateCode {
    CovidCertificateWillExpire = 'covid-certificate-will-expire',
    ChildCovidCertificateWillExpire = 'child-covid-certificate-will-expire',
    DriverLicenseExpiresInFewDays = 'driver-license-expires-in-few-days',
    DriverLicenseExpirationLastDay = 'driver-license-expiration-last-day',
    DriverLicenseDataChanged = 'driver-license-data-changed',
    VehicleLicenseExpiresInFewDaysToOwner = 'vehicle-license-expires-in-few-days-to-owner',
    VehicleLicenseExpirationLastDayToOwner = 'vehicle-license-expiration-last-day-to-owner',
    VehicleLicenseExpiresInFewDaysToProperUser = 'vehicle-license-expires-in-few-days-to-proper-user',
    VehicleLicenseExpirationLastDayToProperUser = 'vehicle-license-expiration-last-day-to-proper-user',
}

export type TemplateParams = Partial<Record<TemplateStub, string>>

export interface CreateNotificationWithPushesParams {
    templateCode: MessageTemplateCode
    userIdentifier: string
    templateParams?: TemplateParams
    resourceId?: string
}

export interface CreateNotificationWithPushesByMobileUidParams extends CreateNotificationWithPushesParams {
    mobileUid: string
}

export type NotificationAppVersionsByPlatformType = Partial<Record<PlatformType, NotificationAppVersions>>

export interface NotificationAppVersions {
    minVersion?: string
    maxVersion?: string
    versions?: string[]
}

export interface PushTopic {
    channel: string
    identifier?: string
}

export interface PushNotificationCampaignEstimations {
    campaignId: string
    subscriptionBatches: number
    targetUsersCount: number
}
