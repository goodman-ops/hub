import { Currency, PaymentType, RequestType } from './PublicRequestTypes';
import { ParsedPaymentOptions } from './paymentOptions/ParsedPaymentOptions';
import { ParsedNimiqSpecifics, ParsedNimiqDirectPaymentOptions } from './paymentOptions/NimiqPaymentOptions';
import { ParsedEtherSpecifics, ParsedEtherDirectPaymentOptions } from './paymentOptions/EtherPaymentOptions';
import { ParsedBitcoinSpecifics, ParsedBitcoinDirectPaymentOptions } from './paymentOptions/BitcoinPaymentOptions';

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
    value: number;
    fee: number;
    data: Uint8Array;
    flags: number;
    validityStartHeight: number; // FIXME To be made optional when hub has its own network
}

export type ParsedProtocolSpecificsForCurrency<C extends Currency> =
    C extends Currency.NIM ? ParsedNimiqSpecifics
    : C extends Currency.BTC ? ParsedBitcoinSpecifics
    : C extends Currency.ETH ? ParsedEtherSpecifics
    : undefined;

export type AvailableParsedPaymentOptions = ParsedNimiqDirectPaymentOptions
                                          | ParsedEtherDirectPaymentOptions
                                          | ParsedBitcoinDirectPaymentOptions;

export type ParsedPaymentOptionsForCurrencyAndType<C extends Currency, T extends PaymentType> =
    T extends PaymentType.DIRECT ?
        C extends Currency.NIM ? ParsedNimiqDirectPaymentOptions
        : C extends Currency.BTC ? ParsedBitcoinDirectPaymentOptions
        : C extends Currency.ETH ? ParsedEtherDirectPaymentOptions
        : ParsedPaymentOptions<C, T>
    : ParsedPaymentOptions<C, T>;

export interface ParsedCheckoutRequest extends ParsedBasicRequest {
    version: number;
    shopLogoUrl?: string;
    callbackUrl?: string;
    csrf?: string;
    data: Uint8Array;
    time: number;
    fiatCurrency?: string;
    fiatAmount?: number;
    paymentOptions: AvailableParsedPaymentOptions[];
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

// Discriminated Unions
export type ParsedRpcRequest = ParsedSignTransactionRequest
                             | ParsedCheckoutRequest
                             | ParsedBasicRequest
                             | ParsedSimpleRequest
                             | ParsedOnboardRequest
                             | ParsedRenameRequest
                             | ParsedSignMessageRequest
                             | ParsedExportRequest;
