import {v4 as uuid } from "uuid";
import { Wallet } from "../../wallet/Wallet";
import { Repository } from "../../storage/Repository";
import { AgentConfig } from "../../agent/AgentConfig";
import { ConnectionRecord } from "../../storage/ConnectionRecord";
import { OutboundMessage } from "../../types";
import { ExchangeRequestMessage } from "./ExchangeRequestMessage";
import { ConnectionInvitationMessage, DIDInvitationData } from "../connections/ConnectionInvitationMessage";
import { ConnectionState } from "../connections/domain/ConnectionState";
import { createOutboundMessage } from "../helpers";
import { PublicKey, PublicKeyType, Service, DidDoc, Authentication } from "../connections/domain/DidDoc";
import { LedgerService } from "../../agent/LedgerService";
import { InboundMessageContext } from "../../agent/models/InboundMessageContext";
import { ExchangeResponseMessage } from "./ExchangeResponseMessage";
import { unpackAndVerifySignatureDecoratorWithKey } from "../../decorators/signature/SignatureDecoratorUtils";
import { ExchangeAck, AckStatus } from "./ExchangeAck";
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import base58 from 'bs58';
import logger from "../../logger";
import { Connection } from "./domain/Connection";

class ExchangeService {
    private wallet: Wallet;
    private config: AgentConfig;
    private connectionRepository: Repository<ConnectionRecord>;
    private ledgerService: LedgerService;

    public constructor(
        wallet: Wallet,
        config: AgentConfig,
        connectionRepository: Repository<ConnectionRecord>,
        ledgerService: LedgerService) {
        this.wallet = wallet;
        this.config = config;
        this.connectionRepository = connectionRepository;
        this.ledgerService = ledgerService;
    }

    private getFullVerkey(identifier: string, verkey: string) {
        const identifierBuffer = base58.decode(identifier);
        const verkeyBuffer = base58.decode(verkey.substring(1))
        return base58.encode(Buffer.concat([identifierBuffer, verkeyBuffer]));
    }

    public async acceptInvitation(invitation: ConnectionInvitationMessage, did?: Did): Promise<OutboundMessage<ExchangeRequestMessage>> {
        if ((invitation as DIDInvitationData).did !== undefined) {
            const [_, method, identifier ] = (invitation as DIDInvitationData).did.split(':')
            const didInfo = await this.ledgerService.getPublicDid(identifier);
            logger.log(`did: ${didInfo.did} verkey: ${didInfo.verkey}`);
            const endpoint = await this.ledgerService.getEndpoint(identifier);
            invitation.serviceEndpoint = endpoint;
            invitation.recipientKeys = [this.getFullVerkey(didInfo.did, didInfo.verkey)];
        }
        const connectionRecord = await this.createConnection(did);
        connectionRecord.invitation = invitation;

        const exchangeRequest = new ExchangeRequestMessage({
            label: this.config.label,
            did: connectionRecord.did,
            didDoc: connectionRecord.didDoc,
        });
        exchangeRequest.setThread({ parentThreadId: invitation.id })
        await this.updateState(connectionRecord, ConnectionState.REQUESTED);

        logger.log('Creating outbound message');
        return createOutboundMessage(connectionRecord, exchangeRequest, invitation);
    }

    public async acceptResponse(messageContext: InboundMessageContext<ExchangeResponseMessage>) {
        const { message, connection: connectionRecord, recipientVerkey } = messageContext;

        if (!connectionRecord) {
            throw new Error(`Connection for verkey ${recipientVerkey} not found!`);
        }
        const connectionJson = await unpackAndVerifySignatureDecoratorWithKey(
            message.connectionSig,
            connectionRecord.invitation!.recipientKeys![0],
            this.wallet
        );
        const connection = plainToClass(Connection, connectionJson);
        await validateOrReject(connection);

        connectionRecord.updateDidExchangeConnection(connection);

        if (!connectionRecord.theirKey) {
            throw new Error(`Connection with verkey ${connectionRecord.verkey} has no recipient keys.`);
        }

        connectionRecord.tags = { ...connectionRecord.tags, theirKey: connectionRecord.theirKey };

        const response = new ExchangeAck({ status: AckStatus.OK, threadId: messageContext.message.getThreadId()! });
        await this.updateState(connectionRecord, ConnectionState.COMPLETE);
        return createOutboundMessage(connectionRecord, response);
    }

    private async createPeerDIDConnection(): Promise<ConnectionRecord> {
        const id = uuid();
        const [ did, verkey ] = await this.wallet.createDid({ method_name: 'peer' });
        const publicKey = new PublicKey(`${did}#1`, PublicKeyType.ED25519_SIG_2018, did, verkey);
        const service = new Service(
            `${did};indy`,
            this.config.getEndpoint(),
            [verkey],
            this.config.getRoutingKeys(),
            0,
            'did-communication',
        );
        const auth = new Authentication(publicKey, true);
        const didDoc = new DidDoc(did, [auth], [publicKey], [service]);
        return new ConnectionRecord({
            id,
            did,
            didDoc,
            verkey,
            state: ConnectionState.INIT,
            tags: { verkey },
        });
    }

    private async createPublicDIDConnectionRecord(did: Did): Promise<ConnectionRecord> {
        const [_, method, identifier] = did.split(':');
        if (method != 'sov') {
            throw new Error(`Non sovrin public DIDs are unsupported at the moment.`);
        }

        const id = uuid();
        const verkey = this.getFullVerkey(identifier, (await this.ledgerService.getPublicDid(identifier)).verkey);
        const endpoint = await this.ledgerService.getEndpoint(identifier);

        const publicKey = new PublicKey(`${did}#1`, PublicKeyType.ED25519_SIG_2018, did, verkey);
        const service = new Service(
            `${did};indy`,
            endpoint,
            [verkey],
            this.config.getRoutingKeys(),
            0,
            'did-communication',
        );
        const auth = new Authentication(publicKey, true);
        const didDoc = new DidDoc(did, [auth], [publicKey], [service]);
        return new ConnectionRecord({
            id,
            did,
            didDoc,
            verkey,
            state: ConnectionState.INIT,
            tags: { verkey },
        });
    }

    public async createConnection(_did = ''): Promise<ConnectionRecord> {
        const connectionRecord = _did == '' ?
            await this.createPeerDIDConnection() :
            await this.createPublicDIDConnectionRecord(_did);

        await this.connectionRepository.save(connectionRecord);
        return connectionRecord;
    }

    public async updateState(connectionRecord: ConnectionRecord, newState: ConnectionState) {
        connectionRecord.state = newState;
        await this.connectionRepository.update(connectionRecord);
    }
}

export { ExchangeService }