<template></template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { State, Getter } from 'vuex-class';
import staticStore, { Static } from '../lib/StaticStore';
import {
    RequestType,
    ParsedRpcRequest,
    ParsedSimpleRequest,
    ParsedSignMessageRequest,
    ParsedSignTransactionRequest,
} from '../lib/RequestTypes';
import { Errors } from '@nimiq/keyguard-client';
import { WalletStore } from '../lib/WalletStore';
import KeyguardClient from '@nimiq/keyguard-client';
import { DEFAULT_KEY_PATH } from '../lib/Constants';
import { WalletInfo } from '../lib/WalletInfo';

@Component
export default class ErrorHandler extends Vue {
    @Static protected request!: ParsedRpcRequest;
    @Static protected keyguardRequest?: KeyguardClient.Request;
    @State protected keyguardResult!: Error;

    @Getter private findWalletByAddress!: (address: string, includeContracts: boolean) => WalletInfo | undefined;
    @Getter private findWalletByKeyId!: (keyId: string) => WalletInfo | undefined;

    public async created() {
        if (!(this.keyguardResult instanceof Error)) return;

        if (this.keyguardResult.message === Errors.Messages.KEY_NOT_FOUND) {
            try {
                const walletInfo = await this.getWalletForThisRequest();
                if (walletInfo) {
                    walletInfo.keyMissing = true;
                    await WalletStore.Instance.put(walletInfo);
                }
            } catch (error) {
                this.$rpc.reject(error);
                return;
            }

            // Redirect to login
            staticStore.originalRouteName = this.request.kind;

            const request: KeyguardClient.ImportRequest = {
                appName: this.request.appName,
                requestedKeyPaths: [DEFAULT_KEY_PATH],
                isKeyLost: true,
            };

            const client = this.$rpc.createKeyguardClient();
            client.import(request);

            return;
        }

        if (this.keyguardResult.message === Errors.Messages.GOTO_CREATE) {
            this.$rpc.routerReplace(RequestType.SIGNUP);
            return;
        }

        // TODO more Error Handling

        this.$rpc.reject(this.keyguardResult);
    }

    private async getWalletForThisRequest(): Promise<WalletInfo | undefined | null> {
        if ((this.request as ParsedSimpleRequest).walletId) {
            // The walletId is already in the Hub request
            return WalletStore.Instance.get((this.request as ParsedSimpleRequest).walletId);
        } else if ((this.request as ParsedSignTransactionRequest).sender
                || (this.request as ParsedSignMessageRequest).signer) {
            // Hub request was SignTransaction/Checkout/SignMessage.
            // The wallet can be found by the (optional) sender/signer address in the Hub request
            const address = (this.request as ParsedSignTransactionRequest).sender
                            || (this.request as ParsedSignMessageRequest).signer;
            return this.findWalletByAddress(address.toUserFriendlyAddress(), true);
        } else if (this.request.kind === RequestType.CHECKOUT
                || this.request.kind === RequestType.SIGN_MESSAGE) {
            // The keyId of the selected address is in the keyguardRequest
            return this.findWalletByKeyId((this.keyguardRequest as KeyguardClient.SignMessageRequest).keyId);
        } else {
            // This really should not happen.
            // Executing this code would mean i.e. a CreateRequest fired KEY_NOT_FOUND which it does not throw
            const err = new Error(`Unexpected: ${this.request.kind} request threw a KEY_NOT_FOUND error.`);
            err.stack = this.keyguardResult.stack;
            throw err;
        }
    }
}
</script>
