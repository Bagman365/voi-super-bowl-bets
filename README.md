# Voi Network Prediction Market (Super Bowl Bets)

A lightweight, on-chain prediction market application built for Voi Network, demonstrating how event-based markets can be implemented using AVM-compatible smart contracts.

---

## Overview

Super Bowl Bet Buddy is a proof-of-concept prediction market designed to showcase transparent, non-custodial betting mechanics on Voi Network.

The application allows users to:

* Connect a Voi-compatible wallet
* Select an outcome in a prediction market (e.g. Team A vs Team B)
* Place an on-chain bet
* Receive automated payouts once the event outcome is resolved

The project emphasizes simplicity, composability, and clarity, making it easy to extend into broader use cases such as sports, governance, or financial prediction markets.

---

## How It Works

### Market Creation

A prediction market is defined with a fixed set of outcomes. Each outcome corresponds to its own on-chain pool.

### Bet Placement

Users deposit funds into the outcome they believe will win. All bets are recorded on-chain via smart contracts.

### Resolution

After the real-world event concludes, the market is resolved by setting the winning outcome.

### Payouts

Winning participants receive proportional payouts from the total pool. Losing stakes are redistributed to winners, subject to any protocol rules or fees.

---

## Key Features

* Fully on-chain betting and settlement logic
* Non-custodial fund management
* Transparent pools and payout calculations
* Simple user experience built with Lovable
* AVM-compatible smart contract architecture

---

## Tech Stack

* Blockchain: Voi Network (AVM-compatible Layer 1)
* Smart Contracts: AVM smart contracts (ARC-style patterns)
* Frontend: Lovable.app
* Wallets: Voi-compatible wallets

---

## Disclaimer

This application is experimental and provided for demonstration purposes only. It is not intended for real-money gambling, financial advice, or production use without proper audits, compliance review, and regulatory consideration.

Use at your own risk.

---

## Future Enhancements

* Support for multiple concurrent markets
* Oracle-based automated market resolution
* Dynamic odds and AMM-style liquidity
* DAO-governed market creation and parameters
* Cross-chain prediction market support

---

## Contributing

Contributions, feedback, and ideas are welcome. If you are interested in building on Voi Network or extending prediction market infrastructure, please open an issue or submit a pull request.

---

## License

MIT License (or project-specific license if updated)

---

Built on Voi Network
