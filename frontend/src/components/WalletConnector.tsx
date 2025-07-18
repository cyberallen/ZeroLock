import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, WalletIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { WalletType } from '@/types';
import Button from '@/components/ui/Button';
import { formatPrincipal } from '@/services/agent';
import { useAppStore } from '@/stores/useAppStore';

interface WalletConnectorProps {
  onConnect?: (principal: string) => void;
  onDisconnect?: () => void;
  supportedWallets?: WalletType[];
}

const WalletConnector: React.FC<WalletConnectorProps> = ({
  onConnect,
  onDisconnect,
  supportedWallets = ['InternetIdentity', 'Plug'],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState<WalletType | null>(null);
  const { isAuthenticated, principal, login, logout, isLoading } = useAuth();
  const { addNotification } = useAppStore();

  const handleConnect = async (walletType: WalletType) => {
    try {
      setIsConnecting(walletType);
      const success = await login(walletType);
      
      if (success && principal) {
        addNotification({
          type: 'success',
          title: 'Wallet Connected Successfully',
          message: `Successfully connected to ${walletType}`,
        });
        onConnect?.(principal.toString());
        setIsOpen(false);
      } else {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Unable to connect to wallet, please try again',
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      addNotification({
        type: 'success',
        title: 'Wallet Disconnected',
        message: 'Successfully disconnected wallet',
      });
      onDisconnect?.();
    } catch (error) {
      console.error('Wallet disconnect error:', error);
      addNotification({
        type: 'error',
        title: 'Disconnect Failed',
        message: 'Unable to disconnect wallet',
      });
    }
  };

  const walletOptions = [
    {
      type: 'InternetIdentity' as WalletType,
      name: 'Internet Identity',
      description: 'Official ICP authentication',
      icon: '🔐',
      available: true,
    },
    {
      type: 'Plug' as WalletType,
      name: 'Plug Wallet',
      description: 'Feature-rich ICP wallet',
      icon: '🔌',
      available: typeof window !== 'undefined' && !!window.ic?.plug,
    },
    {
      type: 'Stoic' as WalletType,
      name: 'Stoic Wallet',
      description: 'Secure ICP wallet',
      icon: '🏛️',
      available: false, // TODO: Implement Stoic wallet support
    },
  ].filter(wallet => supportedWallets.includes(wallet.type));

  if (isAuthenticated && principal) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <WalletIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {formatPrincipal(principal)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          isLoading={isLoading}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        leftIcon={<WalletIcon className="h-4 w-4" />}
        isLoading={isLoading}
      >
        Connect Wallet
      </Button>

      <Transition appear show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      Connect Wallet
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {walletOptions.map((wallet) => (
                      <motion.button
                        key={wallet.type}
                        onClick={() => wallet.available && handleConnect(wallet.type)}
                        disabled={!wallet.available || isConnecting !== null}
                        className={`
                          w-full p-4 rounded-lg border-2 transition-all duration-200
                          ${wallet.available
                            ? 'border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 cursor-pointer'
                            : 'border-gray-100 dark:border-gray-700 cursor-not-allowed opacity-50'
                          }
                          ${isConnecting === wallet.type ? 'border-primary-500 dark:border-primary-400' : ''}
                        `}
                        whileHover={wallet.available ? { scale: 1.02 } : {}}
                        whileTap={wallet.available ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{wallet.icon}</span>
                          <div className="flex-1 text-left">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {wallet.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {wallet.description}
                            </p>
                          </div>
                          {isConnecting === wallet.type && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                          )}
                          {!wallet.available && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      By connecting a wallet, you agree to our terms of service
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default WalletConnector;