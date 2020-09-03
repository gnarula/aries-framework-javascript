import { Equals, IsString, ValidateNested } from 'class-validator';

import { AgentMessage } from '../../agent/AgentMessage';
import { MessageType } from './messages';
import { DidDoc } from '../connections/domain/DidDoc';
import { Type } from 'class-transformer';
import { Connection } from './domain/Connection';

export interface ExchangeRequestMessageOptions {
  id?: string;
  label: string;
  did: string;
  didDoc?: DidDoc;
}

/**
 * Message to communicate the DID document to the other agent when creating a connectino
 *
 */
export class ExchangeRequestMessage extends AgentMessage {
  /**
   * Create new ConnectionRequestMessage instance.
   * @param options
   */
  public constructor(options: ExchangeRequestMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.label = options.label;

      this.connection = new Connection({
        did: options.did,
        didDoc: options.didDoc,
      });
    }
  }

  @Equals(ExchangeRequestMessage.type)
  public readonly type = ExchangeRequestMessage.type;
  public static readonly type = MessageType.ExchangeRequest;

  @IsString()
  public label!: string;

  @Type(() => Connection)
  @ValidateNested()
  public connection!: Connection;
}
