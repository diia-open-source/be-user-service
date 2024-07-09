export enum ExternalEvent {
    DiiaIdCertificateCreate = 'diia-id.certificate.create',
    DiiaIdCertificateInfo = 'diia-id.certificate.info',
    DiiaIdCertificateRevoke = 'diia-id.certificate.revoke',
    DiiaIdCertificateRevokeAll = 'diia-id.certificate.revoke-all',
    DiiaIdHashFile = 'diia-id.hash.file',
    DiiaIdHashFiles = 'diia-id.hash.files',
    DiiaIdHashFilesIntegrity = 'diia-id.hash.files-integrity',
    DiiaIdSignDpsPackageInit = 'diia-id.sign.dps.package.init',
    DiiaIdSignDpsPackagePrepare = 'diia-id.sign.dps.package.prepare',
    DiiaIdSignHashesInit = 'diia-id.sign.hashes.init',
    EResidentDiiaIdCreation = 'eresident.eresident-diiaid-creation',
    FaceRecoUserPhotoExtractFeaturePoints = 'user.photo.extract.feature.points',
    NotificationSendTarget = 'notification.send.target',
    NotificationTopicSubscribe = 'notification.topic.subscribe',
    NotificationTopicSubscribeTarget = 'notification.topic.subscribe.target',
    OfficeIdentifier = 'office.identifier',
    OfficeIdentifierRemoved = 'office.identifier.removed',
    OfficeIdentifierTokenFail = 'office.identifier.token.fail',
    UbkiCreditInfo = 'ubki-credit-info',
    UserGetInfoForFilters = 'user-service.get-info.filters',
}

export enum ExternalTopic {
    DiiaId = 'DiiaId',
    EResident = 'EResident',
    FaceReco = 'FaceReco',
    Notification = 'Notification',
    Office = 'Office',
    Ubki = 'Ubki',
    User = 'User',
}

export enum InternalEvent {
    AcquirersSharingStatus = 'acquirers-sharing-status',
    AcquirersSigningStatus = 'acquirers-signing-status',
    AuthCreateOrUpdateEResidentProfile = 'auth-create-or-update-eresident-profile',
    AuthCreateOrUpdateUserProfile = 'auth-create-or-update-user-profile',
    AuthUserLogOut = 'auth-user-log-out',
    DocumentsAddDocumentInProfile = 'documents-add-document-in-profile',
    DocumentsAddDocumentsInProfile = 'documents-add-documents-in-profile',
    DocumentsAddDocumentPhoto = 'documents-add-document-photo',
    DocumentsAdultRegistrationAddressCommunity = 'documents-adult-registration-address-community',
    DocumentsRemoveDocumentPhoto = 'documents-remove-document-photo',
    PublicServicePenaltyCreated = 'public-service-penalty-created',
    PublicServiceSigningStatus = 'public-service-signing-status',
    RateService = 'rate-service',
    UserPenaltyIdentified = 'user-penalty-identified',
    UserProfileCreated = 'user-profile-created',
    UserSendMassAnonymousNotifications = 'user-send-mass-anonymous-notifications',
    UserSendMassNotifications = 'user-send-mass-notifications',
    UserSendMassSilentPushes = 'user-send-mass-silent-pushes',
}

export enum InternalQueueName {
    QueueUser = 'QueueUser',
}

export enum InternalTopic {
    TopicAcquirersOfferRequestLifeCycle = 'TopicAcquirersOfferRequestLifeCycle',
    TopicAnalytics = 'TopicAnalytics',
    TopicAuthUserSession = 'TopicAuthUserSession',
    TopicDocumentsRegistry = 'TopicDocumentsRegistry',
    TopicPublicServicePenaltiesLifeCycle = 'TopicPublicServicePenaltiesLifeCycle',
    TopicPublicServiceSigningLifeCycle = 'TopicPublicServiceSigningLifeCycle',
    TopicScheduledTasks = 'TopicScheduledTasks',
    TopicUserPenaltiesIdentification = 'TopicUserPenaltiesIdentification',
    TopicUserProfileLifecycle = 'TopicUserProfileLifecycle',
    TopicUserSendMassNotifications = 'TopicUserSendMassNotifications',
}

export enum ScheduledTaskEvent {
    UserCheckCovidCertificatesExpirations = 'user-check-covid-certificates-expirations',
    UserCheckDriverLicensesExpirations = 'user-check-driver-licenses-expirations',
    UserCheckVehicleLicensesExpirations = 'user-check-vehicle-licenses-expirations',
}

export enum ScheduledTaskQueueName {
    ScheduledTasksQueueUser = 'ScheduledTasksQueueUser',
}
