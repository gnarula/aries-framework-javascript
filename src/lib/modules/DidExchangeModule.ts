import { EventEmitter } from 'events'
import { ExchangeService } from "../protocols/didexchange/ExchangeService";
import { ConnectionInvitationMessage } from "../protocols/connections/ConnectionInvitationMessage";
import { MessageSender } from "../agent/MessageSender";

export class DidExchangeModule {
    private exchangeService: ExchangeService;
    private messageSender: MessageSender;
    private publicDid: string

    public constructor(exchangeService: ExchangeService, messageSender: MessageSender, publicDid: string | undefined) {
        this.exchangeService = exchangeService
        this.messageSender = messageSender
        this.publicDid = publicDid || '';
    }

    public async acceptInvite(invite: ConnectionInvitationMessage) {
        const request = await this.exchangeService.acceptInvitation(invite)
        return await this.messageSender.sendMessage(request);
    }

    public async acceptInviteWithPublicDID(invite: ConnectionInvitationMessage) {
        if (this.publicDid === '') {
            throw new Error('Public DID not set');
        }
        const did = `did:sov:${this.publicDid}`;
        const request = await this.exchangeService.acceptInvitation(invite, did)
        return await this.messageSender.sendMessage(request);
    }

    public events(): EventEmitter {
        return this.exchangeService
    }

}