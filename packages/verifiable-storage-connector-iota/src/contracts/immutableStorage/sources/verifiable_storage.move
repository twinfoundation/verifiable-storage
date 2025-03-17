module 0x0::verifiable_storage {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use std::string::{String};
    use iota::event;

    struct StorageItem has key, store {
        id: UID,
        data: String,
        timestamp: u64,
        version: u8,
        creator: address
    }

    struct StorageCreated has copy, drop {
        id: address,
        timestamp: u64
    }

    struct StorageUpdated has copy, drop {
        id: address,
        timestamp: u64
    }

    const E_NOT_AUTHORIZED: u64 = 0;

    public entry fun store_data(data: String, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch(ctx);

        let storage = StorageItem {
            id: object::new(ctx),
            data: data,
            timestamp,
            version: 1,
            creator: sender
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

    /// Update the mutable data of the item.
    public entry fun update_data(storage: &mut StorageItem, data: String, ctx: &mut TxContext) {
		let timestamp = tx_context::epoch(ctx);

        storage.data = data;
		storage.timestamp = timestamp;

        // optionally emit an event
        event::emit(
            StorageUpdated {
                id: object::uid_to_address(&storage.id),
                timestamp
            }
        );		
    }	

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
