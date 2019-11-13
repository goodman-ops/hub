import { CurrencyCodeRecord } from 'currency-codes';
import bigInt from 'big-integer';
import { Currency, PaymentMethod, PaymentOptions } from '../PublicRequestTypes';
import { ParsedPaymentOptions } from '../RequestTypes';
import { createEthereumRequestLink, toNonScientificNumberString, FormattableNumber } from '@nimiq/utils';

export interface EtherDirectPaymentOptions  extends PaymentOptions<Currency.ETH, PaymentMethod.DIRECT> {
    protocolSpecific: {
        gasLimit?: number | string;
        gasPrice?: string;
        recipient?: string;
    };
}

export class ParsedEtherDirectPaymentOptions extends ParsedPaymentOptions<Currency.ETH, PaymentMethod.DIRECT> {
    public readonly digits: number = 18;
    public readonly minDigits: number = 1;
    public readonly maxDigits: number = 3;
    public readonly currency: Currency.ETH = Currency.ETH;
    public readonly type: PaymentMethod.DIRECT = PaymentMethod.DIRECT;
    public amount: bigInt.BigInteger;
    public protocolSpecific: {
        gasLimit?: number;
        gasPrice?: bigInt.BigInteger;
        recipient?: string;
    };

    public get total(): bigInt.BigInteger {
        return this.amount.add(this.fee);
    }

    public get fee(): bigInt.BigInteger {
        return this.protocolSpecific.gasPrice!.times(this.protocolSpecific.gasLimit!) || bigInt(0);
    }

    public get feeString(): string {
        if (this.protocolSpecific.gasPrice) {
            const fee = new FormattableNumber(this.protocolSpecific.gasPrice)
                .moveDecimalSeparator(-9).toString({ maxDecimals: 2 });
            return fee !== '0' ? `Apply a gas price of at least ${fee} gwei.` : '';
        }
        return '';
    }

    public get paymentLink() {
        if (!this.protocolSpecific.recipient) return '#';
        return createEthereumRequestLink(this.protocolSpecific.recipient, {
            amount: this.amount,
            gasLimit: this.protocolSpecific.gasLimit,
            gasPrice: this.protocolSpecific.gasPrice,
        });
    }

    public constructor(option: EtherDirectPaymentOptions) {
        super(option);
        this.amount = bigInt(option.amount); // note that bigInt resolves scientific notation like 2e3 automatically

        let gasLimit: number | undefined;
        if (option.protocolSpecific.gasLimit !== undefined) {
            if (!this.isNonNegativeInteger(option.protocolSpecific.gasLimit)) {
                throw new Error('If provided, gasLimit must be a non-negative integer');
            }
            gasLimit = Number.parseInt(toNonScientificNumberString(option.protocolSpecific.gasLimit), 10);
        }

        let gasPrice: bigInt.BigInteger | undefined;
        if (option.protocolSpecific.gasPrice !== undefined) {
            if (!this.isNonNegativeInteger(option.protocolSpecific.gasPrice)) {
                throw new Error('If provided, gasPrice must be a non-negative integer');
            }
            gasPrice = bigInt(option.protocolSpecific.gasPrice);
        }

        if (option.protocolSpecific.recipient && typeof option.protocolSpecific.recipient !== 'string') {
            // TODO add eth address validation here?
            throw new Error('If a recipient is provided it must be of type string');
        }

        this.protocolSpecific = {
            gasLimit,
            gasPrice,
            recipient: option.protocolSpecific.recipient,
        };
    }

    public update(options: EtherDirectPaymentOptions) {
        const newOptions = new ParsedEtherDirectPaymentOptions(options);
        this.expires = newOptions.expires || this.expires;
        this.amount = newOptions.amount || this.amount;
        this.protocolSpecific = {
            gasLimit: newOptions.protocolSpecific.gasLimit || this.protocolSpecific.gasLimit,
            gasPrice: newOptions.protocolSpecific.gasPrice || this.protocolSpecific.gasPrice,
            recipient: newOptions.protocolSpecific.recipient || this.protocolSpecific.recipient,
        };
    }

    public fiatFee(fiatAmount: number, fiatCurrency: CurrencyCodeRecord): number {
        if (!this.amount || !fiatAmount || !fiatCurrency) {
            throw new Error('amount, fiatAmount and fiatCurrency must be provided');
        }

        if (this.fee.isZero()) {
            return 0;
        }

        return this.fee
            .times(bigInt(Math.round(fiatAmount * (10 ** fiatCurrency.digits))))
            .divide(this.amount) // integer division loss of precision here.
            .valueOf() / (10 ** fiatCurrency.digits);
    }

    public raw(): EtherDirectPaymentOptions {
        return {
            currency: this.currency,
            type: this.type,
            expires: this.expires,
            amount: this.amount.toString(),
            protocolSpecific: {
                gasLimit: this.protocolSpecific.gasLimit,
                gasPrice: this.protocolSpecific.gasPrice
                    ? this.protocolSpecific.gasPrice.toString()
                    : undefined,
                recipient: this.protocolSpecific.recipient,
            },
        };
    }
}
