import { CashlinkTheme } from './PublicRequestTypes';

export enum RequestType {
    LIST = 'list',
    LIST_CASHLINKS = 'list-cashlinks',
    MIGRATE = 'migrate',
    CHECKOUT = 'checkout',
    SIGN_MESSAGE = 'sign-message',
    SIGN_TRANSACTION = 'sign-transaction',
    ONBOARD = 'onboard',
    SIGNUP = 'signup',
    LOGIN = 'login',
    EXPORT = 'export',
    CHANGE_PASSWORD = 'change-password',
    LOGOUT = 'logout',
    ADD_ADDRESS = 'add-address',
    RENAME = 'rename',
    CHOOSE_ADDRESS = 'choose-address',
    CREATE_CASHLINK = 'create-cashlink',
    MANAGE_CASHLINK = 'manage-cashlink',
}

export interface ParsedBasicRequest {
    kind: RequestType;
    appName: string;
}

export interface ParsedSimpleRequest extends ParsedBasicRequest {
    walletId: string;
}

export interface ParsedOnboardRequest extends ParsedBasicRequest {
    disableBack: boolean;
}

export interface ParsedSignTransactionRequest extends ParsedBasicRequest {
    sender: Nimiq.Address;
    recipient: Nimiq.Address;
    recipientType: Nimiq.Account.Type;
    recipientLabel?: string;
    value: number;
    fee: number;
    data: Uint8Array;
    flags: number;
    validityStartHeight: number; // FIXME To be made optional when hub has its own network
}

export interface ParsedCheckoutRequest extends ParsedBasicRequest {
    shopLogoUrl?: string;
    sender?: Nimiq.Address;
    forceSender: boolean;
    recipient: Nimiq.Address;
    recipientType: Nimiq.Account.Type;
    value: number;
    fee: number;
    data: Uint8Array;
    flags: number;
    validityDuration: number;
}

export interface ParsedSignMessageRequest extends ParsedBasicRequest {
    signer?: Nimiq.Address;
    message: string | Uint8Array;
}

export interface ParsedRenameRequest extends ParsedSimpleRequest {
    address?: string;
}

export interface ParsedExportRequest extends ParsedSimpleRequest {
    fileOnly?: boolean;
    wordsOnly?: boolean;
}

export interface ParsedCreateCashlinkRequest extends ParsedBasicRequest {
    senderAddress?: Nimiq.Address;
    senderBalance?: number;
    value?: number;
    message?: string;
    theme: CashlinkTheme;
    returnLink: boolean;
    skipSharing: boolean;
}

export interface ParsedManageCashlinkRequest extends ParsedBasicRequest {
    cashlinkAddress: Nimiq.Address;
}

// Discriminated Unions
export type ParsedRpcRequest = ParsedSignTransactionRequest
                             | ParsedCreateCashlinkRequest
                             | ParsedManageCashlinkRequest
                             | ParsedCheckoutRequest
                             | ParsedBasicRequest
                             | ParsedSimpleRequest
                             | ParsedOnboardRequest
                             | ParsedRenameRequest
                             | ParsedSignMessageRequest
                             | ParsedExportRequest;
