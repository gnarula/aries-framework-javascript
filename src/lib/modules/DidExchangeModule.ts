import { EventEmitter } from 'events';
import { ExchangeService } from '../protocols/didexchange/ExchangeService';
import { ConnectionInvitationMessage } from '../protocols/connections/ConnectionInvitationMessage';
import { MessageSender } from '../agent/MessageSender';
import { ConnectionRecord } from '../storage/ConnectionRecord';
import { Wallet } from '../wallet/Wallet';

export class DidExchangeModule {
  private exchangeService: ExchangeService;
  private messageSender: MessageSender;
  private wallet: Wallet;

  public constructor(exchangeService: ExchangeService, messageSender: MessageSender, wallet: Wallet) {
    this.exchangeService = exchangeService;
    this.messageSender = messageSender;
    this.wallet = wallet;
  }

  public async acceptInvite(invite: ConnectionInvitationMessage) {
    const request = await this.exchangeService.acceptInvitation(invite);
    return await this.messageSender.sendMessage(request);
  }

  public async acceptInviteWithPublicDID(invite: ConnectionInvitationMessage) {
    const publicDid = this.wallet.getPublicDid()?.did;
    if (publicDid === undefined) {
      throw new Error('Public DID not set');
    }
    const did = `did:sov:${publicDid}`;
    const request = await this.exchangeService.acceptInvitation(invite, did);
    return await this.messageSender.sendMessage(request);
  }

  public async findByTheirDid(theirDid: Did): Promise<ConnectionRecord | null> {
    return this.exchangeService.findByTheirDid(theirDid);
  }

  public async find(connectionId: string): Promise<ConnectionRecord | null> {
    return this.exchangeService.find(connectionId);
  }

  public async getAll(): Promise<ConnectionRecord[]> {
    return this.exchangeService.getAll();
  }

  public events(): EventEmitter {
    return this.exchangeService;
  }
}
