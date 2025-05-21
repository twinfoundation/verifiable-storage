module 0x0::verifiable_storage {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use std::string::{String};
    use iota::event;
	use std::vector;

    struct StorageItem has key, store {
        id: UID,
        data: String,
        epoch: u64,
        version: u8,
        creator: address,
        allowlist: vector<address>
    }

    struct StorageCreated has copy, drop {
        id: address,
        epoch: u64,
		creator: address
    }

    struct StorageUpdated has copy, drop {
        id: address,
        epoch: u64,
		updater: address
    }

    const E_UNAUTHORIZED: u64 = 401;

	// Helper: check if address is in allowlist
    fun is_allowed(allowlist: &vector<address>, addr: address): bool {
        let len = vector::length(allowlist);
        let i = 0;
        while (i < len) {
            if (*vector::borrow(allowlist, i) == addr) {
                return true
            };
            i = i + 1;
        };
        false
    }

	/// Store data with an optional allowlist of additional addresses.
    /// If `extra_allowlist` is provided, those addresses are added to the allowlist.
    public entry fun store_data(data: String, extra_allowlist: vector<address>, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let epoch = tx_context::epoch(ctx);

		let allowlist = vector::empty<address>();
        vector::push_back(&mut allowlist, sender);
		// Only update allowlist if the length > 0
        if (vector::length(&extra_allowlist) > 0) {
        	vector::append(&mut allowlist, extra_allowlist);
		};

        let storage = StorageItem {
            id: object::new(ctx),
            data: data,
            epoch,
            version: 1,
            creator: sender,
            allowlist
        };

        // optionally emit an event
        event::emit(
            StorageCreated {
                id: object::uid_to_address(&storage.id),
                epoch,
				creator: sender
            }
        );

        transfer::share_object(storage);
    }

    /// Update the mutable data of the item.
    public entry fun update_data(storage: &mut StorageItem, data: String, updated_allowlist: vector<address>, remove_allowlist: bool, ctx: &mut TxContext) {
		let sender = tx_context::sender(ctx);
        assert!(is_allowed(&storage.allowlist, sender), E_UNAUTHORIZED);

		let epoch = tx_context::epoch(ctx);

        // Only update data if the string length > 0
        if (std::string::length(&data) > 0) {
            storage.data = data;
        };
		storage.epoch = epoch;

		// Only update allowlist if the length > 0, always including the creator
		let allowlist = vector::empty<address>();
		vector::push_back(&mut allowlist, storage.creator);
        if (!remove_allowlist && vector::length(&updated_allowlist) > 0) {
			vector::append(&mut allowlist, updated_allowlist);
		};
		storage.allowlist = allowlist;

        // optionally emit an event
        event::emit(
            StorageUpdated {
                id: object::uid_to_address(&storage.id),
                epoch,
				updater: sender
            }
        );		
    }	

    /// Permanently delete the StorageItem (only creator can do this).
    public entry fun delete_data(
        storage: StorageItem,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == storage.creator, E_UNAUTHORIZED);

        let StorageItem {
            id,
            data: _,
            epoch: _,
            version: _,
            creator: _,
			allowlist: _
        } = storage;

        object::delete(id);
    }
}
