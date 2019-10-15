<script lang="ts">
import { ParsedBitcoinDirectPaymentOptions } from '../lib/paymentOptions/BitcoinPaymentOptions';
import NonNimiqCheckoutOption from './NonNimiqCheckoutOption.vue';
import { moveComma } from '@nimiq/utils';

export default class BitcoinCheckoutOption
    extends NonNimiqCheckoutOption<ParsedBitcoinDirectPaymentOptions> {
    protected currencyFullName = 'Bitcoin';
    protected icon = 'icon-btc.svg';

    protected get manualPaymentDetails() {
        const paymentDetails = [ ...super.manualPaymentDetails, {
            label: 'Amount',
            value: {
                mBTC: moveComma(this.paymentOptions.amount, -this.paymentOptions.digits + 3),
                BTC: moveComma(this.paymentOptions.amount, -this.paymentOptions.digits),
            },
        }];
        if (this.paymentOptions.protocolSpecific.feePerByte || this.paymentOptions.protocolSpecific.fee) {
            const fees: { [key: string]: string | number } = {};
            if (this.paymentOptions.protocolSpecific.feePerByte) {
                fees['SAT/BYTE'] = Math.ceil(this.paymentOptions.protocolSpecific.feePerByte * 100) / 100; // rounded
            }
            if (this.paymentOptions.protocolSpecific.fee) {
                fees.BTC = moveComma(this.paymentOptions.protocolSpecific.fee, -this.paymentOptions.digits);
            }
            paymentDetails.push({
                label: 'Fee',
                value: fees,
            });
        }
        return paymentDetails;
    }
}
</script>
