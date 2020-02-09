import { Connection } from './protocols/connections/domain/Connection';

type $FixMe = any;

export type WireMessage = $FixMe;

export interface InitConfig {
  url?: string;
  port?: string | number;
  label: string;
  walletName: string;
  walletKey: string;
  publicDid?: Did;
  publicDidSeed?: string;
  agencyUrl?: string;
}

export interface Message {
  '@id': string;
  '@type': string;
  [key: string]: any;
}

export interface InboundMessage {
  message: Message;
  sender_verkey: Verkey; // TODO make it optional
  recipient_verkey: Verkey; // TODO make it optional
}

export interface OutboundMessage {
  connection: Connection;
  endpoint?: string;
  payload: Message;
  recipientKeys: Verkey[];
  routingKeys: Verkey[];
  senderVk: Verkey | null;
}

export interface OutboundPackage {
  connection: Connection;
  payload: WireMessage;
  endpoint?: string;
}

export interface InboundConnection {
  verkey: Verkey;
  connection: Connection;
}

export enum AgentEventType {
  CONNECTION_ESTABLISHED = 'connection_established',
  BASICMESSAGE_RECEIVED = 'basicmessage_received',
  // ... TODO: add more event types as we see fit
}

export interface AgentEvent {
  message: {};
  // TODO: event metadata can go in here
}
