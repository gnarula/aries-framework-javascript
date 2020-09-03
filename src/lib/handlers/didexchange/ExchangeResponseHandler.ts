import { Handler, HandlerInboundMessage } from '../Handler';
import { ExchangeService } from '../../protocols/didexchange/ExchangeService';
import { ExchangeResponseMessage } from '../../protocols/didexchange/ExchangeResponseMessage';

export class ExchangeResponseHandler implements Handler {
  private exchangeService: ExchangeService;
  public supportedMessages = [ExchangeResponseMessage];

  public constructor(exchangeService: ExchangeService) {
    this.exchangeService = exchangeService;
  }

  public async handle(inboundMessage: HandlerInboundMessage<ExchangeResponseHandler>) {
    const outboudMessage = await this.exchangeService.acceptResponse(inboundMessage);
    return outboudMessage;
  }
}
