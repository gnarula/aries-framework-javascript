import { EventEmitter } from 'events';
import logger from '../logger';
import { Dispatcher } from './Dispatcher';
import { Wallet } from '../wallet/Wallet';
import { InitConfig } from '../types';
import { Event } from './events';

class MessageReceiver {
  config: InitConfig;
  wallet: Wallet;
  dispatcher: Dispatcher;
  eventEmitter: EventEmitter;

  constructor(config: InitConfig, wallet: Wallet, dispatcher: Dispatcher, eventEmitter: EventEmitter) {
    this.config = config;
    this.wallet = wallet;
    this.dispatcher = dispatcher;
    this.eventEmitter = eventEmitter;
  }

  async receiveMessage(inboundPackedMessage: any) {
    logger.logJson(`Agent ${this.config.label} received message:`, inboundPackedMessage);
    let inboundMessage;

    if (!inboundPackedMessage['@type']) {
      inboundMessage = await this.wallet.unpack(inboundPackedMessage);

      if (!inboundMessage.message['@type']) {
        // TODO In this case we assume we got forwarded JWE message (wire message?) to this agent from agency. We should
        // perhaps try to unpack message in some loop until we have a Aries message in here.
        logger.logJson('Forwarded message', inboundMessage);

        // @ts-ignore
        inboundMessage = await this.wallet.unpack(inboundMessage.message);
      }
    } else {
      inboundMessage = { message: inboundPackedMessage };
    }

    logger.logJson('inboundMessage', inboundMessage);
    const result = await this.dispatcher.dispatch(inboundMessage);
    this.eventEmitter.emit(Event.MESSAGE_RECEIVED, inboundMessage);
    return result;
  }
}

export { MessageReceiver };
