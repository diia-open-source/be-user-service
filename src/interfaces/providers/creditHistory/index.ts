export interface CreditHistoryProvider {
    subscribe(itn: string): Promise<string>
    publishSubscription(itn: string): Promise<void>
    unsubscribe(subId: string, itn: string): Promise<void>
}
