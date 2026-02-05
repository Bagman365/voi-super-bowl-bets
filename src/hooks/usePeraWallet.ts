 import { useState, useEffect, useCallback } from "react";
 import { PeraWalletConnect } from "@perawallet/connect";
 
 const peraWallet = new PeraWalletConnect();
 
 export const usePeraWallet = () => {
   const [accountAddress, setAccountAddress] = useState<string | null>(null);
   const [isConnecting, setIsConnecting] = useState(false);
 
   const handleDisconnect = useCallback(() => {
     setAccountAddress(null);
   }, []);
 
   useEffect(() => {
     // Reconnect session if it exists
     peraWallet
       .reconnectSession()
       .then((accounts) => {
         if (accounts.length) {
           setAccountAddress(accounts[0]);
           peraWallet.connector?.on("disconnect", handleDisconnect);
         }
       })
       .catch(console.error);
   }, [handleDisconnect]);
 
   const connect = async () => {
     setIsConnecting(true);
     try {
       const accounts = await peraWallet.connect();
       if (accounts.length) {
         setAccountAddress(accounts[0]);
         peraWallet.connector?.on("disconnect", handleDisconnect);
       }
     } catch (error) {
       console.error("Pera Wallet connection error:", error);
     } finally {
       setIsConnecting(false);
     }
   };
 
   const disconnect = async () => {
     await peraWallet.disconnect();
     setAccountAddress(null);
   };
 
   const shortenAddress = (address: string) => {
     return `${address.slice(0, 4)}...${address.slice(-4)}`;
   };
 
   return {
     accountAddress,
     isConnecting,
     isConnected: !!accountAddress,
     connect,
     disconnect,
     shortenAddress,
   };
 };