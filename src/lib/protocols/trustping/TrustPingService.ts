import { InboundMessage } from '../../types';
import { createOutboundMessage } from '../helpers';
import { createTrustPingResponseMessage, MessageType } from './messages';
import { Connection } from '../..';
import { ConnectionState } from '../connections/domain/ConnectionState';
import { Context } from '../../agent/Context';
import { AgentEventType } from '../../types';

export class TrustPingService {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  processPing(inboundMessage: InboundMessage, connection: Connection) {
    if (connection.getState() != ConnectionState.COMPLETE) {
      connection.updateState(ConnectionState.COMPLETE);
      this.context.eventEmitter.emit(AgentEventType.CONNECTION_ESTABLISHED, {
        message: { connection },
      });
    }
    if (inboundMessage.message['response_requested']) {
      const reply = createTrustPingResponseMessage(inboundMessage.message['@id']);
      return createOutboundMessage(connection, reply);
    }
    return null;
  }

  processPingResponse(inboundMessage: InboundMessage) {
    return null;
  }
}
