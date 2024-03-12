export enum AuthProviderName {
    Monobank = 'monobank',
    PrivatBank = 'privatbank',
    PhotoId = 'photoid',
    BankId = 'bankid',
    Nfc = 'nfc',
}

export enum AuthSchemaCode {
    DiiaIdCreation = 'diia-id-creation',
    EResidentDiiaIdCreation = 'e-resident-diia-id-creation',
}

export interface RevokeSubmitAfterUserAuthStepsResult {
    success: boolean
    revokedActions: number
}
