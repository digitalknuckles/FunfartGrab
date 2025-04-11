// walletconnect.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

const CONTRACT_ADDRESS = "0x7eFC729a41FC7073dE028712b0FB3950F735f9ca";
const ABI = ["function mintPrize() public"];
const POLYGON_CHAIN_ID = "0x89";

let provider;
let signer;

export async function connectWallet() {
  const WalletConnectProvider = window.WalletConnectProvider.default;

  const wcProvider = new WalletConnectProvider({
    projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
    chains: [137], // Polygon mainnet
    showQrModal: true,
  });

  await wcProvider.enable();
  provider = new ethers.providers.Web3Provider(wcProvider);
  signer = provider.getSigner();

  const network = await provider.getNetwork();
  if (network.chainId !== 137) {
    alert("Please switch your wallet network to Polygon.");
    throw new Error("Wrong network");
  }

  return signer;
}

export async function mintPrize() {
  try {
    if (!signer) await connectWallet();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const tx = await contract.mintPrize();
    await tx.wait();
    alert("NFT Minted Successfully!");
  } catch (error) {
    console.error(error);
    alert("Minting failed: " + (error?.message || error));
  }
}
