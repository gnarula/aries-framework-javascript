// eslint-disable-next-line
// @ts-ignore
import { poll } from 'await-poll';
import { EventEmitter } from 'events';
import { AgentConfig } from '../agent/AgentConfig';
import { ConnectionService } from '../protocols/connections/ConnectionService';
import { ConsumerRoutingService } from '../protocols/routing/ConsumerRoutingService';
import { MessageReceiver } from '../agent/MessageReceiver';
import { ConnectionRecord } from '../storage/ConnectionRecord';
import { ConnectionState } from '../protocols/connections/domain/ConnectionState';
import { ConnectionInvitationMessage } from '../protocols/connections/ConnectionInvitationMessage';
import { Wallet } from '../wallet/Wallet';
import { MessageSender } from '../agent/MessageSender';

export class ConnectionsModule {
  private agentConfig: AgentConfig;
  private connectionService: ConnectionService;
  private consumerRoutingService: ConsumerRoutingService;
  private messageReceiver: MessageReceiver;
  private messageSender: MessageSender;
  private wallet: Wallet;

  public constructor(
    agentConfig: AgentConfig,
    connectionService: ConnectionService,
    consumerRoutingService: ConsumerRoutingService,
    messageReceiver: MessageReceiver,
    messageSender: MessageSender,
    wallet: Wallet
  ) {
    this.agentConfig = agentConfig;
    this.connectionService = connectionService;
    this.consumerRoutingService = consumerRoutingService;
    this.messageReceiver = messageReceiver;
    this.messageSender = messageSender;
    this.wallet = wallet;
  }

  public async createConnection() {
    const { invitation, connection } = await this.connectionService.createConnectionWithInvitation();

    if (!invitation) {
      throw new Error('Connection has no invitation assigned.');
    }

    // If agent has inbound connection, which means it's using agency, we need to create a route for newly created
    // connection verkey at agency.
    if (this.agentConfig.inboundConnection) {
      this.consumerRoutingService.createRoute(connection.verkey);
    }

    return { invitation, connection };
  }

  public async acceptInviteWithPublicDID(invite: ConnectionInvitationMessage) {
    const publicDid = this.wallet.getPublicDid()?.did;
    if (publicDid === undefined) {
      throw new Error('Public DID not set');
    }
    const did = `did:sov:${publicDid}`;
    const request = await this.connectionService.acceptInvitation(invite, did);
    return await this.messageSender.sendMessage(request);
  }

  public async acceptInvitation(invitation: unknown) {
    const connection = (await this.messageReceiver.receiveMessage(invitation))?.connection;

    if (!connection) {
      throw new Error('No connection returned from receiveMessage');
    }

    if (!connection.verkey) {
      throw new Error('No verkey in connection returned from receiveMessage');
    }

    return connection;
  }

  public async returnWhenIsConnected(connectionId: string): Promise<ConnectionRecord> {
    const connectionRecord = await poll(
      () => this.find(connectionId),
      (c: ConnectionRecord) => c.state !== ConnectionState.COMPLETE,
      100
    );
    return connectionRecord;
  }

  public async getAll() {
    return this.connectionService.getConnections();
  }

  public async find(connectionId: string): Promise<ConnectionRecord | null> {
    return this.connectionService.find(connectionId);
  }

  public async findConnectionByVerkey(verkey: Verkey): Promise<ConnectionRecord | null> {
    return this.connectionService.findByVerkey(verkey);
  }

  public async findConnectionByTheirKey(verkey: Verkey): Promise<ConnectionRecord | null> {
    return this.connectionService.findByTheirKey(verkey);
  }

  public events(): EventEmitter {
    return this.connectionService;
  }
}
