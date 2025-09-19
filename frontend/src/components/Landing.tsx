import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShieldCheckIcon,
  LinkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LandingProps {
  onConnectWallet: () => void;
  isConnecting: boolean;
}

const features = [
  {
    icon: UserCircleIcon,
    title: 'NFT Profiles',
    description: 'Your identity as an NFT. True ownership of your digital persona.'
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'On-Chain Posts',
    description: 'Every post, comment, and interaction lives on the blockchain forever.'
  },
  {
    icon: HeartIcon,
    title: 'Social Interactions',
    description: 'Like, comment, follow, and engage in a decentralized social network.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'True Ownership',
    description: 'Your content, your data, your control. No platform lock-in.'
  }
];

export const Landing: React.FC<LandingProps> = ({ onConnectWallet, isConnecting }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900">
      <header className="absolute top-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white"
            >
              SomniaShare
            </motion.div>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
                The Future of
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Social Media
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Experience true digital ownership with NFT profiles, on-chain posts, and 
                decentralized social interactions on Somnia blockchain.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LinkIcon className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </div>
                )}
              </motion.button>
              
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#features"
                className="px-8 py-4 border-2 border-gray-600 text-gray-300 text-lg font-semibold rounded-full hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
              >
                Learn More
              </motion.a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                    <h3 className="text-lg font-semibold text-white text-center">
                      NFT Identity
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
                    <h3 className="text-lg font-semibold text-white text-center">
                      On-Chain Posts
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mx-auto"></div>
                    <h3 className="text-lg font-semibold text-white text-center">
                      True Ownership
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built on Somnia blockchain for speed, security, and true decentralization
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-gray-800 p-6 rounded-2xl border border-gray-700 group-hover:border-blue-600 transition-all duration-300">
                      <Icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white"
          >
            <SparklesIcon className="w-16 h-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-6">
              Ready to Own Your Social Experience?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join the Web3 social revolution. Connect your wallet and start building 
              your decentralized social presence today.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConnectWallet}
              disabled={isConnecting}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Get Started Now'}
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
