import { InboundMessage } from '../../types';
import { createOutboundMessage } from '../helpers';
import { Connection } from '../connections/domain/Connection';
import { createBasicMessage } from './messages';
import { AgentEventType } from '../../types';
import { Context } from '../../agent/Context';

class BasicMessageService {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  send(message: string, connection: Connection) {
    const basicMessage = createBasicMessage(message);
    return createOutboundMessage(connection, basicMessage);
  }

  save(inboundMessage: InboundMessage, connection: Connection) {
    const { message } = inboundMessage;
    connection.messages.push(message);
    connection.emit('basicMessageReceived', message);
    this.context.eventEmitter.emit(AgentEventType.BASICMESSAGE_RECEIVED, {
      message: { basicMessage: message },
    });
    return null;
  }
}

export { BasicMessageService };
