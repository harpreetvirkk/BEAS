import { Client } from 'fabric-common';
/**
 * Configures a client object using a supplied connection profile JSON object.
 * @private
 */
export declare function loadFromConfig(client: Client, config?: any): Promise<void>;
