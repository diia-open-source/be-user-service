import { UserSigningHistoryItem } from '@interfaces/models/userSigningHistoryItem'

export type UpsertItemParams = Omit<UserSigningHistoryItem, 'statusHistory'>
