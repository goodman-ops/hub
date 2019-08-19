import { NETWORK_MAIN } from '../lib/Constants';

export default {
    keyguardEndpoint: 'https://keyguard.nimiq.com',
    network: NETWORK_MAIN,
    networkEndpoint: 'https://network.nimiq.com',
    privilegedOrigins: [
        'https://safe.nimiq.com',
        'https://hub.nimiq.com', // To allow CashlinkReceive to trigger signup/login/onboard
    ],
    reportToSentry: true,
};
