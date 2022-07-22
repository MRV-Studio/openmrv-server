import geotsModel from '../model/geots.model';
import IProvider from '../interface/provider.interface';
import { Keccak } from 'sha3'
import anchorModel from '../model/anchor.model';
import networkMapping from '../deployments.json';
import { Contract, ethers, Wallet } from 'ethers';
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import logger from '../util/logger';
// export NODE_OPTIONS=--openssl-legacy-provider for ERR_OSSL_EVP_UNSUPPORTED
process.env.NODE_OPTIONS = '-openssl-legacy-provider';

class AnchorService {
  private hasher = new Keccak(256);

  private CELO_RPC_ENDPOINT = process.env.NODE_ENV === 'test' ? 'http://localhost:8545' : 'TBD';
  private CHAIN_ID = process.env.NODE_ENV === 'test' ? '31337' : 'TBD';
  private contract = this.getContract();

  private getContract(): Contract {
    try {
      const networkMappingForChain =
        networkMapping[this.CHAIN_ID as keyof typeof networkMapping];
      const geodataContractMapping = networkMappingForChain[0]['contracts']['GeodataAnchor'];
      const jsonRpcProvider = new ethers.providers.JsonRpcProvider(this.CELO_RPC_ENDPOINT);
      const signer = new Wallet(process.env.CELO_LOCAL_TESTNET_PRIVKEY, jsonRpcProvider);
      return new Contract(
        geodataContractMapping.address,
        geodataContractMapping.abi,
        signer
      );
    } catch (error) {
      logger.log({ level: 'error', message: `anchorService.getContract failed: ${error}` });
    }
  }

  public async anchor(provider: IProvider, limit: number) {
    const anchor = new anchorModel({ provider: provider });
    await anchor.save();
    // get unanchored geots
    const anchorables = await geotsModel.find({ "anchor": null }).sort({ ts: -1, _id: 1 }).limit(limit);

    let count = 0;
    this.hasher.reset();
    // create a summary hash from the geots hashes
    for (const anchorable of anchorables) {
      this.hasher.update(anchorable.hash);
      anchorable.set('anchor', anchor);
      await anchorable.save();
      count++;
    }
    const anchorHash = this.hasher.digest('hex');

    // apply the anchor hash to the contract
    try {
      await this.contract
        .addAnchor(anchor._id, ethers.utils.toUtf8Bytes(anchorHash))
        .then(async (tx: TransactionResponse) => {
          console.log('anchor tx hash:', tx.hash);
          const contractReceipt: TransactionReceipt = await tx.wait();
          console.log('transaction receipt:', contractReceipt);
          if (contractReceipt.status === 1) {
            console.log('anchor tx success');
            anchor.set('hash', anchorHash);
            anchor.set('count', count);
            anchor.set('transaction_hash', contractReceipt.transactionHash);
            await anchor.save();
          }
        });
    } catch (error) {
      logger.log({ level: 'error', message: `contract.addAnchor failed: ${error}` });
      // revert db changes
      await geotsModel.updateMany({ "anchor": anchor._id }, { "$set": { "anchor": null } });
      await anchor.remove();
    }

    return { anchor };
  }
}

export default AnchorService;
