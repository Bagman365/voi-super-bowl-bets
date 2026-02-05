 import { useState, useEffect } from "react";
 
 const WALLET_STORAGE_KEY = "algorand_wallet_address";
 
 export const useWallet = () => {
   const [accountAddress, setAccountAddress] = useState<string | null>(null);
   const [isConnecting, setIsConnecting] = useState(false);
 
   useEffect(() => {
     // Check for existing session
     const savedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
     if (savedAddress) {
       setAccountAddress(savedAddress);
     }
   }, []);
 
   const connect = async () => {
     setIsConnecting(true);
     
     // Simulate wallet connection delay
     await new Promise(resolve => setTimeout(resolve, 1500));
     
     // Generate a demo Algorand-style address
     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
     let address = "";
     for (let i = 0; i < 58; i++) {
       address += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     
     setAccountAddress(address);
     localStorage.setItem(WALLET_STORAGE_KEY, address);
     setIsConnecting(false);
   };
 
   const disconnect = () => {
     setAccountAddress(null);
     localStorage.removeItem(WALLET_STORAGE_KEY);
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