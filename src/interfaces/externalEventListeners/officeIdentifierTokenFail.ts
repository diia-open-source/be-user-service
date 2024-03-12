export interface EventPayload {
    uuid: string
    request: {
        profileId: string
        reason: string
    }
}
