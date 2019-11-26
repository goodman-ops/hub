import { TX_VALIDITY_WINDOW, TX_MIN_VALIDITY_DURATION } from '../Constants';
import { Currency, PaymentMethod, PaymentOptions } from '../PublicRequestTypes';
import { ParsedPaymentOptions } from '../RequestTypes';
import { toNonScientificNumberString, Utf8Tools } from '@nimiq/utils';

export interface NimiqProtocolSpecific {
    fee?: number | string;
    feePerByte?: number | string;
    extraData?: Uint8Array | string;
    validityDuration?: number;
    flags?: number;
    sender?: string;
    forceSender?: boolean;
    recipient?: string;
    recipientType?: Nimiq.Account.Type;
}

export type ParsedNimiqProtocolSpecific = Omit<NimiqProtocolSpecific, 'sender' | 'recipient' | 'fee' | 'feePerByte'>
    & Required<Pick<NimiqProtocolSpecific, 'forceSender' | 'flags' | 'validityDuration'>> & {
    sender?: Nimiq.Address,
    recipient?: Nimiq.Address,
    fee: number,
    feePerByte: number,
};

export type NimiqDirectPaymentOptions = PaymentOptions<Currency.NIM, PaymentMethod.DIRECT>;

export class ParsedNimiqDirectPaymentOptions extends ParsedPaymentOptions<Currency.NIM, PaymentMethod.DIRECT> {
    public amount: number;

    public constructor(options: NimiqDirectPaymentOptions) {
        super(options);

        if (options.protocolSpecific.extraData !== undefined && typeof options.protocolSpecific.extraData !== 'string'
            && !(options.protocolSpecific.extraData instanceof Uint8Array)) {
            throw new Error('extraData must be a string or Uint8Array');
        }
        const extraData = typeof options.protocolSpecific.extraData === 'string'
            ? Utf8Tools.stringToUtf8ByteArray(options.protocolSpecific.extraData)
            : options.protocolSpecific.extraData || new Uint8Array(0);

        this.amount = parseInt(toNonScientificNumberString(options.amount), 10);

        let sender: Nimiq.Address | undefined;
        if (options.protocolSpecific.sender !== undefined) {
            try {
                sender = Nimiq.Address.fromUserFriendlyAddress(options.protocolSpecific.sender);
            } catch (err) {
                throw new Error('If provided, sender must be a valid user friendly address string');
            }
        }

        let recipient: Nimiq.Address | undefined;
        if (options.protocolSpecific.recipient !== undefined) {
            try {
                recipient = Nimiq.Address.fromUserFriendlyAddress(options.protocolSpecific.recipient);
            } catch (err) {
                throw new Error('If provided, recipient must be a valid user friendly address string');
            }
        }

        let recipientType: Nimiq.Account.Type | undefined;
        if (options.protocolSpecific.recipientType !== undefined) {
            if (!Object.values(Nimiq.Account.Type).includes(options.protocolSpecific.recipientType)) {
                throw new Error('If provided, recipientType must be a valid Nimiq account type');
            }
            recipientType = options.protocolSpecific.recipientType;
        }

        const flags = options.protocolSpecific.flags;
        if (flags !== undefined && typeof flags !== 'number') {
            throw new Error('If provided, flags must be a number.');
        }

        let feePerByte: number | undefined;
        if (options.protocolSpecific.feePerByte !== undefined) {
            try {
                feePerByte = parseFloat(toNonScientificNumberString(options.protocolSpecific.feePerByte));
            } catch (e) {
                throw new Error('If provided, feePerByte must be a valid number');
            }
        }

        let fee: number | undefined;
        if (options.protocolSpecific.fee !== undefined) {
            if (!this.isNonNegativeInteger(options.protocolSpecific.fee)) {
                throw new Error('If provided, fee must be a non-negative integer');
            }
            fee = parseInt(toNonScientificNumberString(options.protocolSpecific.fee), 10);
        }

        const requiresExtendedTransaction = extraData.byteLength > 0
            || recipientType !== undefined && recipientType !== Nimiq.Account.Type.BASIC
            || flags !== undefined && flags !== Nimiq.Transaction.Flag.NONE;
        // Note that the transaction size can be bigger than this, for example if the sender type the user wants to use
        // requires an extended transaction or if an extended transaction includes a multi signature proof. The size
        // is therefore just an estimate. In the majority of cases the estimate will be accurate though and a fee that
        // is slightly off will generally not be a problem.
        const estimatedTransactionSize = requiresExtendedTransaction ? 166 + extraData.byteLength : 138;

        if (fee === undefined) {
            if (feePerByte === undefined) {
                feePerByte = 0;
                fee = 0;
            } else {
                fee = Math.ceil(feePerByte * estimatedTransactionSize);
            }
        } else {
            feePerByte = fee / estimatedTransactionSize;
        }

        if (options.protocolSpecific.validityDuration !== undefined
            && !this.isNonNegativeInteger(options.protocolSpecific.validityDuration)) {
            throw new Error('If provided, validityDuration must be a non-negative integer.');
        }

        this.protocolSpecific = {
            sender,
            forceSender: !!options.protocolSpecific.forceSender,
            fee,
            feePerByte,
            extraData,
            flags: flags || Nimiq.Transaction.Flag.NONE,
            recipient,
            recipientType,
            validityDuration: !options.protocolSpecific.validityDuration
                ? TX_VALIDITY_WINDOW
                : Math.min(
                    TX_VALIDITY_WINDOW,
                    Math.max(
                        TX_MIN_VALIDITY_DURATION,
                        options.protocolSpecific.validityDuration,
                    ),
                ),
        };
    }

    public get currency(): Currency.NIM {
        return Currency.NIM;
    }

    public get type(): PaymentMethod.DIRECT {
        return PaymentMethod.DIRECT;
    }

    public get decimals(): number {
        return 5;
    }

    public get total(): number {
        return this.amount + this.fee;
    }

    public get fee(): number {
        return this.protocolSpecific.fee;
    }

    public fiatFee(fiatAmount: number): number {
        if (!this.amount || !fiatAmount) {
            throw new Error('amount and fiatAmount must be provided');
        }
        if (!this.fee) {
            return 0;
        }
        return this.fee * fiatAmount / this.amount;
    }

    public raw(): NimiqDirectPaymentOptions {
        return {
            currency: this.currency,
            type: this.type,
            expires: this.expires,
            amount: this.amount.toString(),
            protocolSpecific: {
                recipient: this.protocolSpecific.recipient
                    ? this.protocolSpecific.recipient.toUserFriendlyAddress()
                    : undefined,
                fee: this.protocolSpecific.fee,
                feePerByte: this.protocolSpecific.feePerByte,
                validityDuration: this.protocolSpecific.validityDuration,
                sender: this.protocolSpecific.sender
                    ? this.protocolSpecific.sender.toUserFriendlyAddress()
                    : undefined,
                flags: this.protocolSpecific.flags,
                recipientType: this.protocolSpecific.recipientType,
                forceSender: !!this.protocolSpecific.forceSender,
            },
        };
    }
}
