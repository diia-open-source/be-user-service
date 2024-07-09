export enum ProcessCode {
    OtpVerifyAttemptsExceeded = 16101006,
    OtpSendAttemptsExceeded = 16101007,
    DiiaIdSuccessfullyDeleted = 19101004,
    DiiaIdNotFound = 19101005,
    DiiaIdInCreationProcess = 19101006,
    DiiaIdCreated = 19101007,
    NoValidCertificateDetected = 19101010,
    NoRequiredDocument = 19101011,
    UnknownRequestToSignDocument = 19101012,
    RegistryUnavailableWhenDiiaIdCreating = 19101031,
    RegistryUnavailableWhenSigning = 19101032,
    SignedDocumentsIntegrityViolated = 19101013,
    SubscribedCreditHistory = 25101001,
    FailedSubscribeCreditHistory = 25101002,
    FailedUnsubscribeCreditHistory = 25101003,
    UnsubscribedCreditHistory = 25101004,
}

export enum AttentionMessageParameterType {
    Link = 'link',
    Phone = 'phone',
    Email = 'email',
}

export interface AttentionMessageParameter {
    type: AttentionMessageParameterType
    data: {
        name: string
        alt: string
        resource: string
    }
}

export interface AttentionMessage {
    title?: string
    text?: string
    icon: string
    parameters?: AttentionMessageParameter[]
}

export enum UserIdentifierPrefix {
    Ru = 'ru.',
}
