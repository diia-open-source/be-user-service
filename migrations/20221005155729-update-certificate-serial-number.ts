import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
    await Promise.all([
        db.collection('diiaids').updateMany(
            {},
            {
                $set: { signAlgo: 'DSTU' },
            },
        ),
        db.collection('diiaids').aggregate(
            [
                {
                    $match: {
                        isDeleted: false,
                    },
                },
                {
                    $lookup: {
                        from: 'userprofiles',
                        localField: 'userIdentifier',
                        foreignField: 'identifier',
                        as: 'userprofile',
                    },
                },
                {
                    $unwind: '$userprofile',
                },
                {
                    $addFields: {
                        certificateSerialNumber: '$userprofile.diiaId.certificateSerialNumber',
                        registryUserIdentifier: '$userprofile.diiaId.registryUserIdentifier',
                    },
                },
                {
                    $project: {
                        certificateSerialNumber: 1,
                        registryUserIdentifier: 1,
                    },
                },
                {
                    $merge: {
                        into: 'diiaids',
                        on: '_id',
                    },
                },
            ],
            { allowDiskUse: true },
        ),
    ])
}

export async function down(db: Db): Promise<void> {
    await Promise.all([
        db
            .collection('userprofiles')
            .updateMany({}, [{ $unset: { certificateSerialNumber: '' } }, { $unset: { registryUserIdentifier: '' } }]),
        db.collection('diiaids').updateMany(
            {},
            {
                $unset: { signAlgo: '' },
            },
        ),
    ])
}
