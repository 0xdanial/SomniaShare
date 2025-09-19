# SomniaShare

A decentralized social media platform built on the Somnia blockchain, where users can create NFT profiles, share on-chain posts, and trade content as NFTs.

## 🌟 Features

- **NFT Profiles**: Create and own your digital identity as an NFT
- **On-Chain Posts**: Every post is stored permanently on the blockchain
- **Social Interactions**: Like, comment, follow, and engage with other users
- **NFT Marketplace**: Turn your posts into tradeable NFTs
- **Advertisement System**: Submit and manage ads on the platform
- **Gasless Transactions**: Meta-transactions for seamless user experience
- **Profile Pictures**: Upload and manage your profile images
- **Blue Mark Verification**: Get verified status on the platform

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Wagmi** - Ethereum wallet integration
- **Framer Motion** - Animations
- **Supabase** - Backend services
- **Somnia Blockchain** - Decentralized infrastructure

## 📱 App Structure

- **Landing Page**: Welcome screen with wallet connection
- **Main Feed**: View and create posts from all users
- **Profile**: Personal profile management and posts
- **Marketplace**: Buy and sell post NFTs
- **Advertisement**: Submit and manage advertisements
- **User Profiles**: View other users' profiles and posts

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Network Configuration

The app is configured to work with the Somnia blockchain. Make sure your wallet is connected to the correct network.

## 📝 Environment Setup

Create a `.env.local` file in the root directory with the following variables:
