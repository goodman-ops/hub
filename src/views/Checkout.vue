<template>
    <div class="container">
        <Carousel
            :class="{'offset-currency-info-on-disabled': request.paymentOptions.length > 1}"
            :entries="request.paymentOptions.map((paymentOptions) => paymentOptions.currency)"
            :animationDuration="500"
            :selected="selectedCurrency"
            :disabled="choosenCurrency !== null || availableCurrencies.length === 0"
            @select="selectedCurrency = $event">
            <template v-for="paymentOptions of request.paymentOptions" v-slot:[paymentOptions.currency]>
                <NimiqCheckoutOption
                    v-if="paymentOptions.currency === Currency.NIM"
                    :paymentOptions="paymentOptions"
                    :key="paymentOptions.currency"
                    :class="{confirmed: choosenCurrency === paymentOptions.currency}"
                    @chosen="chooseCurrency"
                    @expired="expired"/>
                <EthereumCheckoutOption
                    v-else-if="paymentOptions.currency === Currency.ETH"
                    :paymentOptions="paymentOptions"
                    :key="paymentOptions.currency"
                    :class="{confirmed: choosenCurrency === paymentOptions.currency}"
                    @chosen="chooseCurrency"
                    @expired="expired"/>
                <BitcoinCheckoutOption
                    v-else-if="paymentOptions.currency === Currency.BTC"
                    :paymentOptions="paymentOptions"
                    :key="paymentOptions.currency"
                    :class="{confirmed: choosenCurrency === paymentOptions.currency}"
                    @chosen="chooseCurrency"
                    @expired="expired"/>
            </template>
        </Carousel>

        <button class="global-close nq-button-s" @click="close">
            <ArrowLeftSmallIcon/>
            Cancel Payment
        </button>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Carousel, ArrowLeftSmallIcon } from '@nimiq/vue-components';
import { ParsedCheckoutRequest } from '../lib/RequestTypes';
import BitcoinCheckoutOption from '../components/BitcoinCheckoutOption.vue';
import EthereumCheckoutOption from '../components/EthereumCheckoutOption.vue';
import NimiqCheckoutOption from '../components/NimiqCheckoutOption.vue';
import { Currency } from '../lib/PublicRequestTypes';
import { State as RpcState } from '@nimiq/rpc';
import staticStore, { Static } from '../lib/StaticStore';
import { ERROR_CANCELED } from '../lib/Constants';

@Component({components: {
    ArrowLeftSmallIcon,
    Carousel,
    BitcoinCheckoutOption,
    EthereumCheckoutOption,
    NimiqCheckoutOption,
}})
export default class Checkout extends Vue {

    @Static private rpcState!: RpcState;
    @Static private request!: ParsedCheckoutRequest;
    private choosenCurrency: Currency | null = null;
    private selectedCurrency: Currency = Currency.NIM;
    private availableCurrencies: Currency[] = [];

    private async created() {
        const $subtitle = document.querySelector('.logo .logo-subtitle')!;
        $subtitle.textContent = 'Checkout';
        this.availableCurrencies = this.request.paymentOptions.map((option) => option.currency);
        document.title = 'Nimiq Checkout';
    }

    private close() {
        this.$rpc.reject(new Error(ERROR_CANCELED));
    }

    private chooseCurrency(currency: Currency) {
        this.selectedCurrency = currency;
        this.choosenCurrency = currency;
    }

    private expired(currency: Currency) {
        this.availableCurrencies.splice(this.availableCurrencies.indexOf(currency), 1);
    }

    private data() {
        return {
            Currency,
        };
    }
}
</script>

<style scoped>
    .container >>> .nq-h1 {
        margin-top: 3.5rem;
        margin-bottom: 1rem;
        line-height: 1;
        text-align: center;
    }

    .carousel {
        width: 100%;
        box-sizing: border-box;
        padding: 0;
        overflow: hidden;
        transition: margin-top 1s var(--nimiq-ease);
    }

    .carousel.disabled.offset-currency-info-on-disabled {
        margin-top: -16.125rem; /* currency-info height */
    }

    .carousel >>> .payment-option {
        padding: 4rem 0;
    }

    .carousel >>> .currency-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform .5s cubic-bezier(.67,0,.16,1), opacity .25s var(--nimiq-ease);
        transform: translateY(0rem);
    }

    .carousel >>> > :not(.selected) .currency-info {
        transform: translateY(-7.875rem);
    }

    .carousel.disabled >>> .currency-info {
        opacity: 0;
    }

    /* make empty padding in cards click through to cards behind */
    .carousel >>> > * {
        pointer-events: none;
    }

    .carousel >>> .currency-info > *,
    .carousel >>> .nq-card {
        pointer-events: all !important;
    }

    /* Show placeholders when card is not selected */
    .carousel >>> .timer,
    .carousel >>> .nq-button,
    .carousel >>> .nq-button-s,
    .carousel >>> .nq-card > .nq-h1,
    .carousel >>> .info-line .account,
    .carousel >>> .info-line .amounts,
    .carousel >>> .nq-card-body .label,
    .carousel >>> .nq-card-body .amounts .crypto,
    .carousel >>> .nq-card-body .amounts .fee,
    .carousel >>> .account-list .amount,
    .carousel >>> .nq-card-footer .nq-link,
    .carousel >>> .account-selector .wallet-label,
    .carousel >>> .nq-card-body .identicon-and-label,
    .carousel >>> .account-list .identicon-and-label > *,
    .carousel >>> .nq-card .non-sufficient-balance .nq-text {
        position: relative;
    }

    .carousel >>> .timer::after,
    .carousel >>> .nq-button::after,
    .carousel >>> .nq-button-s::after,
    .carousel >>> .nq-card > .nq-h1::after,
    .carousel >>> .info-line .account::after,
    .carousel >>> .info-line .amounts::after,
    .carousel >>> .nq-card-body .label::after,
    .carousel >>> .nq-card-body .amounts .crypto::after,
    .carousel >>> .nq-card-body .amounts .fee::after,
    .carousel >>> .account-list .amount::after,
    .carousel >>> .nq-card-footer .nq-link::after,
    .carousel >>> .account-selector .wallet-label::after,
    .carousel >>> .nq-card-body .identicon-and-label::after,
    .carousel >>> .account-list .identicon-and-label > *::after,
    .carousel >>> .nq-card .non-sufficient-balance .nq-text::after {
        --placeholder-size: 100%;
        --placeholder-width: var(--placeholder-size);
        --placeholder-height: var(--placeholder-size);
        content: '';
        position: absolute;
        top: calc((100% - var(--placeholder-height)) / 2);
        left: calc((100% - var(--placeholder-width)) / 2);
        width: var(--placeholder-width);
        height: var(--placeholder-height);
        background-color: #f2f2f4; /* --nimiq-blue 0.06 opacity */
        opacity: 0;
        border: none;
        border-radius: 500px;
        transition: opacity .5s var(--nimiq-ease);
    }

    .carousel >>> .nq-card > .nq-h1::after {
        --placeholder-width: 85%;
    }

    .carousel >>> .info-line .amounts::after,
    .carousel >>> .info-line .account::after {
        --placeholder-height: 3.25rem;
        top: initial;
        box-shadow: 0 0 0 1rem var(--nimiq-card-bg);
    }

    .carousel >>> .nq-button::after,
    .carousel >>> .nq-button-s::after {
        --placeholder-size: 105%;
    }

    .carousel >>> .nq-card-body .identicon-and-label::after {
        --placeholder-size: 21rem;
        top: initial;
        left: initial;
        box-shadow: 0 0 0 4rem var(--nimiq-card-bg);
    }

    .carousel >>> .nq-card .non-sufficient-balance .nq-text::after {
        --placeholder-width: 90%;
    }

    .carousel >>> .nq-card > .nq-h1::after,
    .carousel >>> .nq-card-body .label::after,
    .carousel >>> .nq-card-body .amounts .crypto::after,
    .carousel >>> .nq-card-footer .nq-link::after,
    .carousel >>> .nq-card .non-sufficient-balance .nq-text::after {
        box-shadow: 0 0 0 .6rem var(--nimiq-card-bg);
    }

    .carousel >>> > :not(.selected) .timer::after,
    .carousel >>> > :not(.selected) .nq-button::after,
    .carousel >>> > :not(.selected) .nq-button-s::after,
    .carousel >>> > :not(.selected) .nq-card > .nq-h1::after,
    .carousel >>> > :not(.selected) .info-line .account::after,
    .carousel >>> > :not(.selected) .info-line .amounts::after,
    .carousel >>> > :not(.selected) .nq-card-body .label::after,
    .carousel >>> > :not(.selected) .account-list .amount::after,
    .carousel >>> > :not(.selected) .nq-card-body .amounts .crypto::after,
    .carousel >>> > :not(.selected) .nq-card-body .amounts .fee::after,
    .carousel >>> > :not(.selected) .nq-card-footer .nq-link::after,
    .carousel >>> > :not(.selected) .account-selector .wallet-label::after,
    .carousel >>> > :not(.selected) .nq-card-body .identicon-and-label::after,
    .carousel >>> > :not(.selected) .account-list .identicon-and-label > *::after,
    .carousel >>> > :not(.selected) .nq-card .non-sufficient-balance .nq-text::after {
        opacity: 1;
    }

    .carousel >>> > :not(.selected) .amounts {
        transition: border-top-color .5s var(--nimiq-ease);
        border-top-color: var(--nimiq-card-bg);
    }

    .carousel >>> > :not(.selected) .nq-button {
        transition: box-shadow .5s var(--nimiq-ease);
        box-shadow: none;
    }

    .carousel >>> > :not(.selected) .arrow-runway {
        transition: opacity .5s var(--nimiq-ease);
        opacity: 0;
    }
</style>
