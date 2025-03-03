import React, { useState, useEffect, ChangeEvent } from "react";
import { ethers } from "ethers";
import {
  Wallet,
  ArrowRight,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

// Extracted tournament ABI


function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [tournamentDetails, setTournamentDetails] = useState<string>("");
  const [tournamentId, setTournamentId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

 

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error("Please install MetaMask!");
        return;
      }
      const accounts: string[] = await ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length !== 0) {
        setAccount(accounts[0]);
        await fetchEthBalance(accounts[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to wallet");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error("Please install MetaMask!");
        return;
      }
      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      if (chainIdHex !== chainId) {
        await switchToBaseSepolia();
      }
      setIsLoading(true);
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      await fetchEthBalance(accounts[0]);
      setIsLoading(false);
      toast.success("Wallet connected!");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast.error("Error connecting wallet");
    }
  };

  const switchToBaseSepolia = async () => {
    try {
      const { ethereum } = window as any;
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId,
                chainName,
                rpcUrls: [rpcUrl],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: [blockExplorerUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch network");
    }
  };

  const fetchEthBalance = async (address: string) => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) return;
      const provider = new ethers.BrowserProvider(ethereum);
      const ethBalanceWei = await provider.getBalance(address);
      const formattedEthBalance = ethers.formatEther(ethBalanceWei);
      setEthBalance(parseFloat(formattedEthBalance).toFixed(4));
    } catch (error) {
      console.error(error);
      toast.error("Error fetching ETH balance");
    }
  };

  const getTournamentDetails = async () => {
    if (!tournamentId) {
      toast.error("Please enter a tournament ID");
      return;
    }
    try {
      setIsLoading(true);
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error("Please install MetaMask!");
        setIsLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(ethereum);
      // console.log(tournamentABI);
      const tournamentContract = new ethers.Contract(
        contractAddress,
        tournamentABI,
        provider
      );

      const details = await tournamentContract.tournaments(
        parseInt(tournamentId)
      );

      const prizePool = details.prizePool.toString();
      const seedPool = details.seedPool.toString();
      const endTime = Number(details.endTime);
      const detailsString = `Prize Pool: ${prizePool} | Seed Pool: ${seedPool} | Ends At: ${endTime}`;
      console.log("details", details);
      setTournamentDetails(detailsString);
      toast.success("Tournament details fetched!");
    } catch (error) {
      console.error(error);
      toast.error("Error fetching tournament details");
    } finally {
      setIsLoading(false);
    }
  };

  const depositETH = async () => {
    if (!depositAmount) {
      toast.error("Enter an amount to deposit");
      return;
    }
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error("Please install MetaMask!");
        return;
      }
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const wethContract = new ethers.Contract(
        wethContractAddress,
        wethABI,
        signer
      );
      const tx = await wethContract.deposit({
        value: ethers.parseEther(depositAmount),
      });
      setTxHash(tx.hash);
      toast.success("Deposit transaction sent. Waiting for confirmation...");
      await tx.wait();
      toast.success("Deposit confirmed!");
      if (account) {
        fetchEthBalance(account);
      }
      setDepositAmount("");
    } catch (error: any) {
      console.error(error);
      toast.error("Error during deposit");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const refreshBalances = async () => {
    if (!account) return;
    setIsLoading(true);
    await fetchEthBalance(account);
    setIsLoading(false);
    toast.success("Balances refreshed!");
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // console.log(tournamentId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="pt-6 pb-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Tournament Wallet</h1>
          </div>
          <div>
            {account ? (
              <div className="flex items-center space-x-2 bg-blue-800 rounded-full px-4 py-2">
                <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                <span className="text-sm">{formatAddress(account)}</span>
                <button
                  onClick={() => copyToClipboard(account)}
                  className="text-blue-300 hover:text-blue-100"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full transition duration-200 flex items-center"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!account ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <Wallet className="h-16 w-16 mb-4 text-blue-300" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-blue-200 mb-6 max-w-md">
              Connect your MetaMask wallet to interact with the Base Sepolia
              testnet and manage tournaments.
            </p>
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-200 flex items-center"
            >
              {isLoading ? "Connecting..." : "Connect MetaMask"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className="col-span-1 bg-blue-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Balance</h2>
                <button
                  onClick={refreshBalances}
                  disabled={isLoading}
                  className="text-blue-300 hover:text-white"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <div className="bg-blue-700 rounded-lg p-4">
                <div className="text-blue-300 text-sm mb-1">ETH Balance</div>
                <div className="text-2xl font-bold">{ethBalance} ETH</div>
              </div>

              {/* Deposit Section for WETH */}
              <div className="mt-6 pt-4 border-t border-blue-700">
                <div className="text-sm text-blue-300 mb-2">
                  Deposit ETH for WETH
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    className="bg-blue-700 border border-blue-600 rounded-lg px-4 py-2 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={depositETH}
                    disabled={isLoading || !depositAmount}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Deposit ETH
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-700">
                <div className="text-sm text-blue-300 mb-2">
                  Contract Address
                </div>
                <div className="flex items-center justify-between bg-blue-900 rounded-lg p-3">
                  <span className="text-sm truncate">
                    {formatAddress(contractAddress)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(contractAddress)}
                      className="text-blue-300 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`${blockExplorerUrl}/address/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament Interaction Card */}
            <div className="col-span-2 bg-blue-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6">Tournament Actions</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-blue-300 text-sm mb-2">
                    Tournament ID
                  </label>
                  <input
                    type="text"
                    value={tournamentId}
                    onChange={(e) => setTournamentId(e.target.value)}
                    placeholder="e.g., 1"
                    className="w-full bg-blue-700 border border-blue-600 rounded-lg px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-blue-300 text-sm mb-2">
                    Amount to Add to Pool
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-blue-700 border border-blue-600 rounded-lg px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={getTournamentDetails}
                    disabled={isLoading || !tournamentId}
                    className="w-1/2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                  >
                    {isLoading ? "Fetching..." : "Get Details"}
                  </button>
                </div>

                {tournamentDetails && (
                  <div className="bg-blue-900/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">
                      Tournament Details
                    </h3>
                    <p className="text-sm">{tournamentDetails}</p>
                  </div>
                )}
              </div>

              {txHash && (
                <div className="mt-6 pt-4 border-t border-blue-700">
                  <div className="text-sm text-blue-300 mb-2">
                    Transaction Hash
                  </div>
                  <div className="flex items-center justify-between bg-blue-900 rounded-lg p-3">
                    <span className="text-sm truncate">
                      {formatAddress(txHash)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(txHash)}
                        className="text-blue-300 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`${blockExplorerUrl}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-blue-900/50 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">
                  Network Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-blue-300">Network</div>
                    <div className="font-medium">{chainName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-300">Chain ID</div>
                    <div className="font-medium">{parseInt(chainId, 16)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-blue-300">RPC URL</div>
                    <div className="font-medium truncate">{rpcUrl}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* <footer className="container mx-auto px-4 py-6 mt-auto">
        <div className="text-center text-blue-300 text-sm">
          <p>
            This is a test wallet for Base Sepolia testnet tournament
            interactions.
          </p>
          <p className="mt-1">Do not use with real funds.</p>
        </div>
      </footer> */}
    </div>
  );
}

export default App;
