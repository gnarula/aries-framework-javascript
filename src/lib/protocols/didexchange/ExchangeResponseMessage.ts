import { Equals, IsString, ValidateNested } from 'class-validator';
import { Type, Expose } from 'class-transformer';

import { AgentMessage } from '../../agent/AgentMessage';
import { MessageType } from './messages';
import { SignatureDecorator } from '../../decorators/signature/SignatureDecorator';

export interface ExchangeResponseMessageOptions {
  id?: string;
  connectionSig: SignatureDecorator
  threadId: string
}

/**
 * DID Exchange Response message
 *
 */
export class ExchangeResponseMessage extends AgentMessage {
  /**
   * Create new ConnectionRequestMessage instance.
   * @param options
   */
  public constructor(options: ExchangeResponseMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.connectionSig = options.connectionSig;

      this.setThread({ threadId: options.threadId })
    }
  }

  @Equals(ExchangeResponseMessage.type)
  public readonly type = ExchangeResponseMessage.type;
  public static readonly type = MessageType.ExchangeResponse;

  @Type(() => SignatureDecorator)
  @ValidateNested()
  @Expose({ name: 'connection~sig' })
  public connectionSig!: SignatureDecorator;
}
