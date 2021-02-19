import { BlockListener, ListenerOptions } from '../../events';
import { EventServiceManager } from './eventservicemanager';
export declare class BlockEventSource {
    private readonly eventServiceManager;
    private eventService?;
    private readonly listeners;
    private eventListener?;
    private readonly blockQueue;
    private readonly asyncNotifier;
    private readonly blockType;
    private started;
    constructor(eventServiceManager: EventServiceManager, options?: ListenerOptions);
    addBlockListener(listener: BlockListener): Promise<BlockListener>;
    removeBlockListener(listener: BlockListener): void;
    close(): void;
    private start;
    private registerListener;
    private unregisterListener;
    private startEventService;
    private blockEventCallback;
    private onBlockEvent;
    private newBlockEvent;
    private notifyListeners;
    private getNextBlockNumber;
}
