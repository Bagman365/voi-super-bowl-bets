 import { useState, useEffect, useCallback, useRef } from "react";
 
 type PeraWalletConnectType = {
   connect: () => Promise<string[]>;
   disconnect: () => Promise<void>;
   reconnectSession: () => Promise<string[]>;
   connector?: { on: (event: string, callback: () => void) => void };
 };
 
 export const usePeraWallet = () => {
   const [accountAddress, setAccountAddress] = useState<string | null>(null);
   const [isConnecting, setIsConnecting] = useState(false);
   const [isReady, setIsReady] = useState(false);
   const peraWalletRef = useRef<PeraWalletConnectType | null>(null);
 
   const handleDisconnect = useCallback(() => {
     setAccountAddress(null);
   }, []);
 
   useEffect(() => {
     // Dynamically import Pera Wallet to avoid SSR/bundling issues
     const initPeraWallet = async () => {
       try {
         const { PeraWalletConnect } = await import("@perawallet/connect");
         peraWalletRef.current = new PeraWalletConnect();
         setIsReady(true);
 
         // Reconnect session if it exists
         const accounts = await peraWalletRef.current.reconnectSession();
         if (accounts.length) {
           setAccountAddress(accounts[0]);
           peraWalletRef.current.connector?.on("disconnect", handleDisconnect);
         }
       } catch (error) {
         console.error("Failed to initialize Pera Wallet:", error);
         setIsReady(true); // Still mark as ready so button is visible
       }
     };
 
     initPeraWallet();
   }, [handleDisconnect]);
 
   const connect = async () => {
     if (!peraWalletRef.current) {
       console.error("Pera Wallet not initialized");
       return;
     }
     
     setIsConnecting(true);
     try {
       const accounts = await peraWalletRef.current.connect();
       if (accounts.length) {
         setAccountAddress(accounts[0]);
         peraWalletRef.current.connector?.on("disconnect", handleDisconnect);
       }
     } catch (error) {
       console.error("Pera Wallet connection error:", error);
     } finally {
       setIsConnecting(false);
     }
   };
 
   const disconnect = async () => {
     if (peraWalletRef.current) {
       await peraWalletRef.current.disconnect();
     }
     setAccountAddress(null);
   };
 
   const shortenAddress = (address: string) => {
     return `${address.slice(0, 4)}...${address.slice(-4)}`;
   };
 
   return {
     accountAddress,
     isConnecting,
     isConnected: !!accountAddress,
     isReady,
     connect,
     disconnect,
     shortenAddress,
   };
 };