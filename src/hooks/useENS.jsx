import { getDefaultProvider } from '@ethersproject/providers';
import { useEffect, useState } from 'react';

export function useENS(address) {
  const [ensName, setENSName] = useState();

  useEffect(() => {
    async function resolveENS() {
      if (address) {
        const provider = await getDefaultProvider();
        const name = await provider.lookupAddress(address);
        if (name) setENSName(name);
      }
    }
    resolveENS();
  }, [address]);

  return { ensName };
}
