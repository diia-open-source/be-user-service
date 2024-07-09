import { QueueConfigType } from '@diia-inhouse/diia-queue'

import { ExternalEvent, ExternalTopic, InternalEvent, InternalQueueName, InternalTopic, ScheduledTaskQueueName } from '@interfaces/queue'

export default {
    portalEvents: [],
    internalEvents: Object.values(InternalEvent),
    queuesConfig: {
        [QueueConfigType.Internal]: {
            [InternalQueueName.QueueUser]: {
                topics: [
                    InternalTopic.TopicDocumentsRegistry,
                    InternalTopic.TopicPublicServicePenaltiesLifeCycle,
                    InternalTopic.TopicPublicServiceSigningLifeCycle,
                    InternalTopic.TopicAuthUserSession,
                    InternalTopic.TopicAcquirersOfferRequestLifeCycle,
                ],
            },
            [ScheduledTaskQueueName.ScheduledTasksQueueUser]: {
                topics: [InternalTopic.TopicScheduledTasks],
            },
        },
    },
    servicesConfig: {
        [QueueConfigType.Internal]: {
            subscribe: [ScheduledTaskQueueName.ScheduledTasksQueueUser, InternalQueueName.QueueUser],
            publish: [
                InternalTopic.TopicUserPenaltiesIdentification,
                InternalTopic.TopicUserSendMassNotifications,
                InternalTopic.TopicUserProfileLifecycle,
                InternalTopic.TopicAnalytics,
            ],
        },
        [QueueConfigType.External]: {
            subscribe: [
                ExternalEvent.NotificationSendTarget,
                ExternalEvent.NotificationTopicSubscribeTarget,
                ExternalEvent.UserGetInfoForFilters,
                ExternalEvent.OfficeIdentifierRemoved,
                ExternalEvent.OfficeIdentifierTokenFail,
            ],
            publish: [
                ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints,
                ExternalEvent.DiiaIdCertificateInfo,
                ExternalEvent.DiiaIdCertificateCreate,
                ExternalEvent.DiiaIdCertificateRevoke,
                ExternalEvent.DiiaIdCertificateRevokeAll,
                ExternalEvent.DiiaIdHashFile,
                ExternalEvent.DiiaIdHashFiles,
                ExternalEvent.DiiaIdSignHashesInit,
                ExternalEvent.DiiaIdHashFilesIntegrity,
                ExternalEvent.DiiaIdSignDpsPackageInit,
                ExternalEvent.DiiaIdSignDpsPackagePrepare,
                ExternalEvent.UbkiCreditInfo,
                ExternalEvent.NotificationTopicSubscribe,
                ExternalEvent.EResidentDiiaIdCreation,
                ExternalEvent.OfficeIdentifier,
            ],
        },
    },
    topicsConfig: {
        [QueueConfigType.Internal]: {
            [InternalTopic.TopicUserPenaltiesIdentification]: {
                events: [InternalEvent.UserPenaltyIdentified],
            },
            [InternalTopic.TopicUserSendMassNotifications]: {
                events: [
                    InternalEvent.UserSendMassNotifications,
                    InternalEvent.UserSendMassAnonymousNotifications,
                    InternalEvent.UserSendMassSilentPushes,
                ],
            },
            [InternalTopic.TopicUserProfileLifecycle]: {
                events: [InternalEvent.UserProfileCreated],
            },
            [InternalTopic.TopicAnalytics]: {
                events: [InternalEvent.RateService],
            },
        },
        [QueueConfigType.External]: {
            [ExternalTopic.DiiaId]: {
                events: [
                    ExternalEvent.DiiaIdCertificateCreate,
                    ExternalEvent.DiiaIdCertificateRevoke,
                    ExternalEvent.DiiaIdCertificateRevokeAll,
                    ExternalEvent.DiiaIdHashFile,
                    ExternalEvent.DiiaIdHashFiles,
                    ExternalEvent.DiiaIdSignHashesInit,
                    ExternalEvent.DiiaIdHashFilesIntegrity,
                    ExternalEvent.DiiaIdSignDpsPackageInit,
                    ExternalEvent.DiiaIdSignDpsPackagePrepare,
                    ExternalEvent.DiiaIdCertificateInfo,
                ],
            },
            [ExternalTopic.EResident]: {
                events: [ExternalEvent.EResidentDiiaIdCreation],
            },
            [ExternalTopic.FaceReco]: {
                events: [ExternalEvent.FaceRecoUserPhotoExtractFeaturePoints],
            },
            [ExternalTopic.Notification]: {
                events: [
                    ExternalEvent.NotificationSendTarget,
                    ExternalEvent.NotificationTopicSubscribe,
                    ExternalEvent.NotificationTopicSubscribeTarget,
                ],
            },
            [ExternalTopic.Office]: {
                events: [ExternalEvent.OfficeIdentifier, ExternalEvent.OfficeIdentifierRemoved, ExternalEvent.OfficeIdentifierTokenFail],
            },
            [ExternalTopic.Ubki]: {
                events: [ExternalEvent.UbkiCreditInfo],
            },
            [ExternalTopic.User]: {
                events: [ExternalEvent.UserGetInfoForFilters],
            },
        },
    },
}
