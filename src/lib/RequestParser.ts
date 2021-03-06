import { TX_MIN_VALIDITY_DURATION, TX_VALIDITY_WINDOW } from './Constants';
import { isPriviledgedOrigin } from '@/lib/Helpers';
import { State } from '@nimiq/rpc';
import {
    BasicRequest,
    CashlinkTheme,
    CheckoutRequest,
    CreateCashlinkRequest,
    ExportRequest,
    ManageCashlinkRequest,
    OnboardRequest,
    RenameRequest,
    RpcRequest,
    SignMessageRequest,
    SignTransactionRequest,
    SimpleRequest,
} from './PublicRequestTypes';
import {
    ParsedBasicRequest,
    ParsedCheckoutRequest,
    ParsedCreateCashlinkRequest,
    ParsedExportRequest,
    ParsedManageCashlinkRequest,
    ParsedOnboardRequest,
    ParsedRenameRequest,
    ParsedRpcRequest,
    ParsedSignMessageRequest,
    ParsedSignTransactionRequest,
    ParsedSimpleRequest,
    RequestType,
} from './RequestTypes';
import { Utf8Tools } from '@nimiq/utils';

export class RequestParser {
    public static parse(request: RpcRequest, state: State, requestType: RequestType): ParsedRpcRequest | null {
        if (!request.appName) throw new Error('appName is required');

        switch (requestType) {
            case RequestType.SIGN_TRANSACTION:
                const signTransactionRequest = request as SignTransactionRequest;

                if (!signTransactionRequest.value) throw new Error('value is required');
                if (!signTransactionRequest.validityStartHeight) throw new Error('validityStartHeight is required');

                return {
                    kind: RequestType.SIGN_TRANSACTION,
                    appName: signTransactionRequest.appName,
                    sender: Nimiq.Address.fromUserFriendlyAddress(signTransactionRequest.sender),
                    recipient: Nimiq.Address.fromUserFriendlyAddress(signTransactionRequest.recipient),
                    recipientType: signTransactionRequest.recipientType || Nimiq.Account.Type.BASIC,
                    recipientLabel: signTransactionRequest.recipientLabel,
                    value: signTransactionRequest.value,
                    fee: signTransactionRequest.fee || 0,
                    data: typeof signTransactionRequest.extraData === 'string'
                        ? Utf8Tools.stringToUtf8ByteArray(signTransactionRequest.extraData)
                        : signTransactionRequest.extraData || new Uint8Array(0),
                    flags: signTransactionRequest.flags || Nimiq.Transaction.Flag.NONE,
                    validityStartHeight: signTransactionRequest.validityStartHeight,
                } as ParsedSignTransactionRequest;
            case RequestType.CHECKOUT:
                const checkoutRequest = request as CheckoutRequest;

                if (!checkoutRequest.value) throw new Error('value is required');
                if (checkoutRequest.shopLogoUrl && new URL(checkoutRequest.shopLogoUrl).origin !== state.origin) {
                    throw new Error(
                        'shopLogoUrl must have same origin as caller website. Image at ' +
                        checkoutRequest.shopLogoUrl +
                        ' is not on caller origin ' +
                        state.origin);
                }
                return {
                    kind: RequestType.CHECKOUT,
                    appName: checkoutRequest.appName,
                    shopLogoUrl: checkoutRequest.shopLogoUrl,
                    sender: checkoutRequest.sender
                        ? Nimiq.Address.fromUserFriendlyAddress(checkoutRequest.sender)
                        : undefined,
                    forceSender: !!checkoutRequest.forceSender,
                    recipient: Nimiq.Address.fromUserFriendlyAddress(checkoutRequest.recipient),
                    recipientType: checkoutRequest.recipientType || Nimiq.Account.Type.BASIC,
                    value: checkoutRequest.value,
                    fee: checkoutRequest.fee || 0,
                    data: typeof checkoutRequest.extraData === 'string'
                        ? Utf8Tools.stringToUtf8ByteArray(checkoutRequest.extraData)
                        : checkoutRequest.extraData || new Uint8Array(0),
                    flags: checkoutRequest.flags || Nimiq.Transaction.Flag.NONE,
                    validityDuration: !checkoutRequest.validityDuration ? TX_VALIDITY_WINDOW : Math.min(
                        TX_VALIDITY_WINDOW,
                        Math.max(
                            TX_MIN_VALIDITY_DURATION,
                            checkoutRequest.validityDuration,
                        ),
                    ),
                } as ParsedCheckoutRequest;
            case RequestType.ONBOARD:
                const onboardRequest = request as OnboardRequest;
                return {
                    kind: requestType,
                    appName: onboardRequest.appName,
                    disableBack: !!onboardRequest.disableBack,
                } as ParsedOnboardRequest;
            case RequestType.SIGNUP:
            case RequestType.CHOOSE_ADDRESS:
            case RequestType.LOGIN:
            case RequestType.MIGRATE:
                return {
                    kind: requestType,
                    appName: request.appName,
                } as ParsedBasicRequest;
            case RequestType.CHANGE_PASSWORD:
            case RequestType.LOGOUT:
            case RequestType.ADD_ADDRESS:
                const simpleRequest = request as SimpleRequest;

                if (!simpleRequest.accountId) throw new Error('accountId is required');

                return {
                    kind: requestType,
                    appName: simpleRequest.appName,
                    walletId: simpleRequest.accountId,
                } as ParsedSimpleRequest;
            case RequestType.EXPORT:
                const exportRequest = request as ExportRequest;

                if (!exportRequest.accountId) throw new Error('accountId is required');

                return {
                    kind: RequestType.EXPORT,
                    appName: exportRequest.appName,
                    walletId: exportRequest.accountId,
                    fileOnly: exportRequest.fileOnly,
                    wordsOnly: exportRequest.wordsOnly,
                } as ParsedExportRequest;
            case RequestType.RENAME:
                const renameRequest = request as RenameRequest;

                if (!renameRequest.accountId) throw new Error('accountId is required');

                return {
                    kind: RequestType.RENAME,
                    appName: renameRequest.appName,
                    walletId: renameRequest.accountId,
                    address: renameRequest.address,
                } as ParsedRenameRequest;
            case RequestType.SIGN_MESSAGE:
                const signMessageRequest = request as SignMessageRequest;
                if (typeof signMessageRequest.message !== 'string'
                    && !(signMessageRequest.message instanceof Uint8Array)) {
                    throw new Error('message must be a string or Uint8Array');
                }
                return {
                    kind: RequestType.SIGN_MESSAGE,
                    appName: signMessageRequest.appName,
                    signer: signMessageRequest.signer
                        ? Nimiq.Address.fromUserFriendlyAddress(signMessageRequest.signer)
                        : undefined,
                    message: signMessageRequest.message,
                } as ParsedSignMessageRequest;
            case RequestType.CREATE_CASHLINK:
                const createCashlinkRequest = request as CreateCashlinkRequest;
                const senderAddress = 'senderAddress' in createCashlinkRequest
                    ? Nimiq.Address.fromUserFriendlyAddress(createCashlinkRequest.senderAddress)
                    : undefined;
                const senderBalance = 'senderBalance' in createCashlinkRequest
                    ? createCashlinkRequest.senderBalance
                    : undefined;
                if (senderBalance !== undefined && !Nimiq.NumberUtils.isUint64(senderBalance)) {
                    throw new Error('Invalid Cashlink senderBalance');
                }

                const value = createCashlinkRequest.value;
                if (value !== undefined && (!Nimiq.NumberUtils.isUint64(value) || value === 0)) {
                    throw new Error('Malformed Cashlink value');
                }

                let message = 'message' in createCashlinkRequest ? createCashlinkRequest.message : undefined;
                if (message !== undefined) {
                    if (typeof message !== 'string') {
                        throw new Error('Cashlink message must be a string');
                    }
                    const { result: truncated, didTruncate } = Utf8Tools.truncateToUtf8ByteLength(message, 255);
                    if (!('autoTruncateMessage' in createCashlinkRequest && createCashlinkRequest.autoTruncateMessage)
                        && didTruncate) {
                        throw new Error('Cashlink message must be shorter than 256 bytes or autoTruncateMessage must '
                            + 'be enabled.');
                    }
                    message = truncated;
                }

                const theme = createCashlinkRequest.theme || CashlinkTheme.UNSPECIFIED;
                if (!Object.values(CashlinkTheme).includes(theme) || !Nimiq.NumberUtils.isUint8(theme)) {
                    // Also checking whether theme is a valid Uint8 to catch ids that are potentially to high in the
                    // CashlinkTheme enum and to filter out values that are actually the enum keys that have been added
                    // by typescript for reverse mapping.
                    throw new Error('Invalid Cashlink theme');
                }

                const returnLink = !!createCashlinkRequest.returnLink;
                if (returnLink && !isPriviledgedOrigin(state.origin)) {
                    throw new Error(`Origin ${state.origin} is not authorized to request returnLink.`);
                }
                const skipSharing = !!createCashlinkRequest.returnLink && !!createCashlinkRequest.skipSharing;

                return {
                    kind: RequestType.CREATE_CASHLINK,
                    appName: createCashlinkRequest.appName,
                    senderAddress,
                    senderBalance,
                    value,
                    message,
                    theme,
                    returnLink,
                    skipSharing,
                } as ParsedCreateCashlinkRequest;
            case RequestType.MANAGE_CASHLINK:
                const manageCashlinkRequest = request as ManageCashlinkRequest;
                return {
                    kind: RequestType.MANAGE_CASHLINK,
                    appName: manageCashlinkRequest.appName,
                    cashlinkAddress: Nimiq.Address.fromUserFriendlyAddress(manageCashlinkRequest.cashlinkAddress),
                } as ParsedManageCashlinkRequest;
            default:
                return null;
        }
    }

    public static raw(request: ParsedRpcRequest): RpcRequest | null {
        switch (request.kind) {
            case RequestType.SIGN_TRANSACTION:
                const signTransactionRequest = request as ParsedSignTransactionRequest;
                return {
                    appName: signTransactionRequest.appName,
                    sender: signTransactionRequest.sender.toUserFriendlyAddress(),
                    recipient: signTransactionRequest.recipient.toUserFriendlyAddress(),
                    recipientType: signTransactionRequest.recipientType,
                    recipientLabel: signTransactionRequest.recipientLabel,
                    value: signTransactionRequest.value,
                    fee: signTransactionRequest.fee,
                    extraData: signTransactionRequest.data,
                    flags: signTransactionRequest.flags,
                    validityStartHeight: signTransactionRequest.validityStartHeight,
                } as SignTransactionRequest;
            case RequestType.CREATE_CASHLINK:
                const createCashlinkRequest = request as ParsedCreateCashlinkRequest;
                // Note that there is no need to export autoTruncateMessage as the message already got truncated
                return {
                    appName: createCashlinkRequest.appName,
                    senderAddress: createCashlinkRequest.senderAddress
                            ? createCashlinkRequest.senderAddress.toUserFriendlyAddress()
                            : undefined,
                    senderBalance: createCashlinkRequest.senderBalance,
                    value: createCashlinkRequest.value,
                    message: createCashlinkRequest.message,
                    theme: createCashlinkRequest.theme,
                    returnLink: createCashlinkRequest.returnLink,
                    skipSharing: createCashlinkRequest.skipSharing,
                } as CreateCashlinkRequest;
            case RequestType.MANAGE_CASHLINK:
                const manageCashlinkRequest = request as ParsedManageCashlinkRequest;
                return {
                    appName: manageCashlinkRequest.appName,
                    cashlinkAddress: manageCashlinkRequest.cashlinkAddress
                        ? manageCashlinkRequest.cashlinkAddress.toUserFriendlyAddress()
                        : undefined,
                } as ManageCashlinkRequest;
            case RequestType.CHECKOUT:
                const checkoutRequest = request as ParsedCheckoutRequest;
                return {
                    appName: checkoutRequest.appName,
                    shopLogoUrl: checkoutRequest.shopLogoUrl,
                    sender: checkoutRequest.sender ? checkoutRequest.sender.toUserFriendlyAddress() : undefined,
                    forceSender: checkoutRequest.forceSender,
                    recipient: checkoutRequest.recipient.toUserFriendlyAddress(),
                    recipientType: checkoutRequest.recipientType,
                    value: checkoutRequest.value,
                    fee: checkoutRequest.fee,
                    extraData: checkoutRequest.data,
                    flags: checkoutRequest.flags,
                    validityDuration: checkoutRequest.validityDuration,
                } as CheckoutRequest;
            case RequestType.ONBOARD:
                const onboardRequest = request as ParsedOnboardRequest;
                return {
                    appName: onboardRequest.appName,
                    disableBack: onboardRequest.disableBack,
                } as OnboardRequest;
            case RequestType.SIGNUP:
            case RequestType.CHOOSE_ADDRESS:
            case RequestType.LOGIN:
            case RequestType.MIGRATE:
                return {
                    appName: request.appName,
                } as BasicRequest;
            case RequestType.CHANGE_PASSWORD:
            case RequestType.LOGOUT:
            case RequestType.ADD_ADDRESS:
                const simpleRequest = request as ParsedSimpleRequest;
                return {
                    appName: simpleRequest.appName,
                    accountId: simpleRequest.walletId,
                } as SimpleRequest;
            case RequestType.EXPORT:
                const exportRequest = request as ParsedExportRequest;
                return {
                    appName: exportRequest.appName,
                    accountId: exportRequest.walletId,
                    fileOnly: exportRequest.fileOnly,
                    wordsOnly: exportRequest.wordsOnly,
                } as ExportRequest;
            case RequestType.RENAME:
                const renameRequest = request as ParsedRenameRequest;
                return {
                    appName: renameRequest.appName,
                    accountId: renameRequest.walletId,
                    address: renameRequest.address,
                } as RenameRequest;
            case RequestType.SIGN_MESSAGE:
                const signMessageRequest = request as ParsedSignMessageRequest;
                return {
                    appName: signMessageRequest.appName,
                    signer: signMessageRequest.signer ? signMessageRequest.signer.toUserFriendlyAddress() : undefined,
                    message: signMessageRequest.message,
                } as SignMessageRequest;
            default:
                return null;
        }
    }
}
