<script lang="ts">
import { ParsedEtherDirectPaymentOptions } from '../lib/paymentOptions/EtherPaymentOptions';
import NonNimiqCheckoutOption from './NonNimiqCheckoutOption.vue';
import { moveComma, round } from '@nimiq/utils';

export default class EtherCheckoutOption
    extends NonNimiqCheckoutOption<ParsedEtherDirectPaymentOptions> {
    protected currencyFullName = 'Ethereum';
    protected icon = 'icon-eth.svg';

    protected get manualPaymentDetails() {
        const paymentDetails = [ ...super.manualPaymentDetails, {
            label: 'Amount',
            value: {
                ETH: moveComma(this.paymentOptions.amount, -this.paymentOptions.digits),
            },
        }];
        if (this.paymentOptions.protocolSpecific.gasPrice) {
            paymentDetails.push({
                label: 'Gas Price',
                value: {
                    GWEI: round(moveComma(this.paymentOptions.protocolSpecific.gasPrice, -9), 2),
                    ETH: moveComma(this.paymentOptions.protocolSpecific.gasPrice, -this.paymentOptions.digits),
                },
            });
        }
        if (this.paymentOptions.protocolSpecific.gasLimit) {
            paymentDetails.push({
                label: 'Gas Limit',
                value: this.paymentOptions.protocolSpecific.gasLimit,
            });
        }
        return paymentDetails;
    }
}
</script>
