import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SilentStake',
  projectId: 'silentstake-app-connect',
  chains: [sepolia],
  ssr: false,
});
