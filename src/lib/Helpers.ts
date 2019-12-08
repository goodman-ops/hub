import Config from 'config';
import {
    NETWORK_TEST,
    NETWORK_DEV,
    NETWORK_MAIN,
    ERROR_INVALID_NETWORK,
} from '../lib/Constants';
import { Utf8Tools } from '@nimiq/utils';

export const loadNimiq = async () => {
    await Nimiq.WasmHelper.doImport();
    let genesisConfigInitialized = true;
    try {
        Nimiq.GenesisConfig.NETWORK_ID; // tslint:disable-line:no-unused-expression
    } catch (e) {
        genesisConfigInitialized = false;
    }
    if (!genesisConfigInitialized) {
        switch (Config.network) {
            case NETWORK_TEST:
                Nimiq.GenesisConfig.test();
                break;
            case NETWORK_MAIN:
                Nimiq.GenesisConfig.main();
                break;
            case NETWORK_DEV:
                Nimiq.GenesisConfig.dev();
                break;
            default:
                throw new Error(ERROR_INVALID_NETWORK);
        }
    }
};

export function isPriviledgedOrigin(origin: string) {
    return Config.privilegedOrigins.includes(origin) || Config.privilegedOrigins.includes('*');
}

type TruncateStringResult = { truncatedString: string, truncatedBytes: Uint8Array, didTruncate: boolean };
export function truncateString(str: string, byteLength: number, applyEllipsis: boolean = true): TruncateStringResult {
    let bytes = Utf8Tools.stringToUtf8ByteArray(str);

    if (bytes.length <= byteLength) {
        return {
            truncatedString: str,
            truncatedBytes: bytes,
            didTruncate: false,
        };
    }

    const ellipsisBytes = [226, 128, 166];
    if (byteLength < ellipsisBytes.length) applyEllipsis = false;

    bytes = bytes.subarray(0, byteLength - (applyEllipsis ? ellipsisBytes.length : 0));

    // Cut off last byte until byte array is valid utf-8
    while (!Utf8Tools.isValidUtf8(bytes)) bytes = bytes.subarray(0, bytes.length - 1);

    if (applyEllipsis) {
        // Add ellipsis. Note that we can safely extend by the ellipsis bytes as we shoved these bytes off before.
        bytes = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length + ellipsisBytes.length);
        bytes.set(ellipsisBytes, bytes.length - ellipsisBytes.length);
    }

    return {
        truncatedString: Utf8Tools.utf8ByteArrayToString(bytes),
        truncatedBytes: bytes,
        didTruncate: true,
    };
}
