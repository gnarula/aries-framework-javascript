import { InboundMessage } from '../../types';
import { createOutboundMessage } from '../helpers';
import { createAckMessage } from '../connections/messages';
import { Connection } from '../connections/domain/Connection';
import { BasicMessageRepository, CustomBasicMessage } from './BasicMessageRepository';
import { createBasicMessage } from './messages';

class BasicMessageService {
  basicMessageRepository: BasicMessageRepository;

  constructor(basicMessageRepository: BasicMessageRepository) {
    this.basicMessageRepository = basicMessageRepository;
  }

  send(message: string, connection: Connection) {
    const basicMessage = createBasicMessage(message);
    this.basicMessageRepository.save({ role: 'sender', message: basicMessage });
    return createOutboundMessage(connection, basicMessage);
  }

  save(inboundMessage: InboundMessage, connection: Connection) {
    const { message } = inboundMessage;
    this.basicMessageRepository.save({ role: 'receiver', message });
    const response = createAckMessage(message['@id']);
    return createOutboundMessage(connection, response);
  }

  getMessages(): CustomBasicMessage[] {
    return this.basicMessageRepository.getAll();
  }
}

export { BasicMessageService };
