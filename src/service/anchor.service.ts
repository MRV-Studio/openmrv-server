import geotsModel from '../model/geots.model';
import IProvider from '../interface/provider.interface';
import { Keccak } from 'sha3'
import anchorModel from '../model/anchor.model';

class AnchorService {
  private hasher = new Keccak(256);

  public async anchor(provider: IProvider, limit: number) {
    const anchor = new anchorModel({ provider: provider });
    await anchor.save();
    const anchorables = await geotsModel.find({"anchor": null}).sort({ ts: -1, _id: 1 }).limit(limit);
    this.hasher.reset();
    for (const anchorable of anchorables) {
      this.hasher.update(anchorable.hash);
      anchorable.set('anchor', anchor);
      await anchorable.save();
    }
    const anchorHash = this.hasher.digest('hex');
    anchor.set('hash', anchorHash);
    await anchor.save();

    return { anchor };
  }
}

export default AnchorService;
