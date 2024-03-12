import { UserSharingHistoryItem } from '@interfaces/models/userSharingHistoryItem'

export type UpsertItemParams = Omit<UserSharingHistoryItem, 'statusHistory'>
