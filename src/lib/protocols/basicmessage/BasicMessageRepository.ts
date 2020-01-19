import { Message } from '../../types';

export interface CustomBasicMessage {
  role: 'sender' | 'receiver';
  message: Message;
}

export class BasicMessageRepository {
  messages: CustomBasicMessage[] = [];

  getAll() {
    return this.messages;
  }

  save(message: CustomBasicMessage) {
    this.messages.push(message);
  }
}
