module 0x0::immutable_storage {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use iota::event;

    struct StorageItem has key, store {
        id: UID,
        data: String,
        timestamp: u64,
        version: u8,
        creator: address,
        // is_deleted: bool
    }

    struct StorageCreated has copy, drop {
        id: address,
        timestamp: u64
    }

    const E_NOT_AUTHORIZED: u64 = 0;

    public entry fun store_data(data: vector<u8>, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        let storage = StorageItem {
            id: object::new(ctx),
            data: string::utf8(data),
            timestamp,
            version: 1,
            creator: sender,
            // is_deleted: false
        };

        // optionally emit an event
        event::emit(
            StorageCreated {
                id: object::uid_to_address(&storage.id),
                timestamp
            }
        );

        transfer::transfer(storage, sender);
    }

    // public entry fun delete_data(
    //     storage: &mut StorageItem,
    //     ctx: &mut TxContext
    // ) {
    //     let sender = tx_context::sender(ctx);
    //     assert!(
    //         sender == storage.creator,
    //         E_NOT_AUTHORIZED
    //     );

    //     // Mark as deleted
    //     storage.is_deleted = true;
    // }

    /// Permanently delete the StorageItem
    public entry fun delete_data(
        storage: StorageItem,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == storage.creator,
            E_NOT_AUTHORIZED
        );

        let StorageItem {
            id,
            data: _,
            timestamp: _,
            version: _,
            creator: _
        } = storage;

        object::delete(id);
    }
}
