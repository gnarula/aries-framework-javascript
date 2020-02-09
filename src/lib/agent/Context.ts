import { Wallet } from '../wallet/Wallet';
import { InitConfig, InboundConnection } from '../types';
import { MessageSender } from './MessageSender';
import { EventEmitter } from 'events';

export interface Context {
  config: InitConfig;
  wallet: Wallet;
  inboundConnection?: InboundConnection;
  messageSender: MessageSender;
  eventEmitter: EventEmitter;
}
