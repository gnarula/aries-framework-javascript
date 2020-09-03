import { IsString } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

import { DidDoc } from '../../connections/domain/DidDoc';

export interface ConnectionOptions {
  did: string;
  didDoc?: DidDoc;
}

/**
 * Connection differs in serialisation from the one used in the connnection
 * protocol
 */
export class Connection {
  public constructor(options: ConnectionOptions) {
    if (options) {
      this.did = options.did;
      this.didDoc = options.didDoc;
    }
  }

  @IsString()
  @Expose({ name: 'did' })
  public did!: string;

  @Expose({ name: 'did_doc' })
  // TODO: add type for DidDoc
  // When we add the @Type json object DidDoc parameter will be cast to DidDoc class instance
  // However the DidDoc class is not yet decorated using class-transformer
  // meaning it will give errors because the class will be invalid.
  // for now the DidDoc class is however correctly cast from class instance to json
  // @Type(() => DidDoc)
  // This way we also don't need the custom transformer
  @Transform((value: DidDoc) => (value.toJSON ? value.toJSON() : value), { toPlainOnly: true })
  public didDoc?: DidDoc;
}
