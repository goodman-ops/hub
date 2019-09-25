type BigInteger = import('big-integer').BigInteger; // imports only the type without bundling
import CurrencyCode from 'currency-codes';
import { isMilliseconds } from './Constants';
import { moveComma } from '@nimiq/utils';
import {
    RequestType,
    PaymentOptions,
    Currency,
    PaymentMethod,
    MultiCurrencyCheckoutRequest,
} from './PublicRequestTypes';
import {
    ParsedNimiqDirectPaymentOptions,
    ExtendedNimiqDirectPaymentOptions,
 } from './paymentOptions/NimiqPaymentOptions';
import {
    ParsedEtherDirectPaymentOptions,
    EtherDirectPaymentOptions,
} from './paymentOptions/EtherPaymentOptions';
import {
    ParsedBitcoinDirectPaymentOptions,
    BitcoinDirectPaymentOptions,
} from './paymentOptions/BitcoinPaymentOptions';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

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

export interface ParsedPaymentOptions<C extends Currency, T extends PaymentMethod> {
    readonly currency: C;
    readonly type: T;
    expires: number;
    paymentLink: string;
    raw(): PaymentOptions<C, T>;
}

export abstract class ParsedPaymentOptions<C extends Currency, T extends PaymentMethod>
    implements ParsedPaymentOptions<C, T> {
    public abstract amount: number | BigInteger;
    public readonly abstract digits: number;
    public readonly abstract minDigits: number;
    public readonly abstract maxDigits: number;
    public expires: number;

    public constructor(option: PaymentOptions<C, T>) {
        this.expires = isMilliseconds(option.expires)
            ? option.expires
            : option.expires * 1000;
    }

    public get baseUnitAmount(): string {
        return moveComma(this.amount, -this.digits);
    }

    public abstract update(options: PaymentOptions<C, T>): void;
}

export type AvailableParsedPaymentOptions = ParsedNimiqDirectPaymentOptions
                                   | ParsedEtherDirectPaymentOptions
                                   | ParsedBitcoinDirectPaymentOptions;

export type ParsedPaymentOptionsForCurrencyAndType<C extends Currency, T extends PaymentMethod> =
    T extends PaymentMethod.DIRECT ?
        C extends Currency.NIM ? ParsedNimiqDirectPaymentOptions
        : C extends Currency.BTC ? ParsedBitcoinDirectPaymentOptions
        : C extends Currency.ETH ? ParsedEtherDirectPaymentOptions
        : ParsedPaymentOptions<C, T>
    : ParsedPaymentOptions<C, T>;

export interface ParsedCheckoutRequest extends ParsedBasicRequest {
    shopLogoUrl?: string;
    callbackUrl?: string;
    csrf?: string;
    data: Uint8Array;
    time: number;
    fiatCurrency?: CurrencyCode.CurrencyCodeRecord;
    fiatAmount?: number;
    paymentOptions: AvailableParsedPaymentOptions[];
}

export type ExtendedPaymentOptions = ExtendedNimiqDirectPaymentOptions
                                   | EtherDirectPaymentOptions
                                   | BitcoinDirectPaymentOptions;

export type ExtendedCheckoutRequest = Omit<MultiCurrencyCheckoutRequest,
    'paymentOptions' | 'fiatCurrency' | 'fiatAmount'> & {
    fiatCurrency?: CurrencyCode.CurrencyCodeRecord;
    fiatAmount?: number;
    paymentOptions: ExtendedPaymentOptions[];
};

export type ExtendedRpcRequest = ExtendedCheckoutRequest;

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

export interface ParsedCashlinkRequest extends ParsedBasicRequest {
    senderAddress?: Nimiq.Address;
    senderBalance?: number;
    cashlinkAddress?: Nimiq.Address;
}

// Discriminated Unions
export type ParsedRpcRequest = ParsedSignTransactionRequest
                             | ParsedCashlinkRequest
                             | ParsedCheckoutRequest
                             | ParsedBasicRequest
                             | ParsedSimpleRequest
                             | ParsedOnboardRequest
                             | ParsedRenameRequest
                             | ParsedSignMessageRequest
                             | ParsedExportRequest;
