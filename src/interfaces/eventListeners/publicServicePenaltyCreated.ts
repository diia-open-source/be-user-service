export interface EventPayload {
    penaltyId: string
    vehicleLicenseIdentifier?: string
    fixingDate: Date
}

export interface IdentifiedPenalty {
    penaltyId: string
    penaltyFixingDate: Date
    userIdentifier: string
}
