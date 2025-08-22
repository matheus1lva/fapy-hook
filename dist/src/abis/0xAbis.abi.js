"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YEARN_VAULT_ABI_04 = exports.YEARN_VAULT_V022_ABI = exports.YEARN_VAULT_V030_ABI = void 0;
exports.YEARN_VAULT_V030_ABI = [
    {
        name: 'Transfer',
        inputs: [
            { type: 'address', name: 'sender', indexed: true },
            { type: 'address', name: 'receiver', indexed: true },
            { type: 'uint256', name: 'value', indexed: false },
        ],
        anonymous: false,
        type: 'event',
    },
];
exports.YEARN_VAULT_V022_ABI = [
    {
        name: 'Transfer',
        inputs: [
            { type: 'address', name: 'sender', indexed: true },
            { type: 'address', name: 'receiver', indexed: true },
            { type: 'uint256', name: 'value', indexed: false },
        ],
        anonymous: false,
        type: 'event',
    },
];
exports.YEARN_VAULT_ABI_04 = [
    {
        name: 'Transfer',
        inputs: [
            { name: 'sender', type: 'address', indexed: true },
            { name: 'receiver', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
        ],
        anonymous: false,
        type: 'event',
    },
];
