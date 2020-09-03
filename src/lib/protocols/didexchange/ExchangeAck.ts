import { Equals, IsEnum } from 'class-validator';

import { AgentMessage } from '../../agent/AgentMessage';
import { MessageType } from './messages';

/**
 * Ack message status types
 */
export enum AckStatus {
  OK = 'ok',
  FAIL = 'fail',
  PENDING = 'pending',
}

export interface ExchangeAckOptions {
  id?: string;
  threadId: string;
  status: AckStatus;
}

/**
 * Message to communicate the DID document to the other agent when creating a connectino
 *
 */
export class ExchangeAck extends AgentMessage {
  /**
   * Create new ConnectionRequestMessage instance.
   * @param options
   */
  public constructor(options: ExchangeAckOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.status = options.status;

      this.setThread({ threadId: options.threadId });
    }
  }

  @Equals(ExchangeAck.type)
  public readonly type = ExchangeAck.type;
  public static readonly type = MessageType.ExchangeAck;

  @IsEnum(AckStatus)
  public status!: AckStatus;
}
