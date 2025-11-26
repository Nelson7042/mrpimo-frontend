import { ArrowLeft, Phone, ChevronDown, Package } from "lucide-react";
import React, { useState } from "react";

// Product Dropdown Component
const ProductDropdown = ({ currentProduct, currentGroup, onProductSwitch }: {
  currentProduct: any;
  currentGroup: any;
  onProductSwitch?: (chat: any, product: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!currentGroup?.productChats || currentGroup.productChats.length <= 1) {
    return <h3 className="font-semibold">{currentProduct?.name}</h3>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded-lg transition-colors"
      >
        <Package size={16} className="text-blue-600" />
        <span className="font-semibold">{currentProduct?.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-64">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Switch Product Chat</div>
            {currentGroup.productChats.map((productChat: any) => (
              <button
                key={productChat.chatId}
                onClick={() => {
                  onProductSwitch?.(productChat, productChat.product);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2 rounded hover:bg-gray-50 transition-colors ${
                  productChat.product._id === currentProduct?._id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{productChat.product.name}</p>
                    <p className="text-xs text-gray-500 truncate">{productChat.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type Props = {
  closeChat: () => void;
  chat?: any;
  product?: any;
  setProductModal: (value: { isOpen: boolean; product: any }) => void;
  participantName: string;
  currentGroup?: any;
  onProductSwitch?: (chat: any, product: any) => void;
};

const ChatContainerHeader = (props: Props) => {
  return (
    <div>
      {/* Chat container header */}
      <div className="py-4 bg-[#eff3fd] rounded-t-2xl px-2 lg:rounded-none lg:px-0">
        <div className="flex justify-between items-center lg:px-2 mb-2">
          <div className="flex gap-x-2 items-center">
            <ArrowLeft
              size={20}
              onClick={props.closeChat}
              className="opacity-80 lg:hidden"
            />
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {props.participantName.charAt(0).toUpperCase()}
                  </span>
                </div>
            <div className="flex flex-col gap-y-1 items-start">
              <h1 className="font-semibold text-sm opacity-80">
                {props.chat?.senderName}
              </h1>
              <div className="text-xs">
                {props.chat?.onlineStatus ? (
                  <div className="relative">
                    <p className="bg-green-100 text-green-800 p-1 px-2 rounded-md">
                      online
                    </p>
                    <div className="absolute size-2 rounded-full right-[-1] top-0 bg-green-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="relative opacit-70">
                    <p className="bg-red-100 text-red-800 p-1 px-2 rounded-md">
                      offline
                    </p>
                    <div className="absolute size-2 rounded-full right-[-1] top-0 bg-red-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-x-2">
            <div className="flex items-center bg-[#8baff9] rounded-full p-2 justify-center">
              <Phone
                size={20}
                strokeWidth={2}
                className="text-white fill-white"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-2">
          <ProductDropdown 
            currentProduct={props.product}
            currentGroup={props.currentGroup}
            onProductSwitch={props.onProductSwitch}
          />
          <button
            onClick={() =>
              props.setProductModal({ isOpen: true, product: props.product })
            }
            className="text-blue-600 text-sm hover:underline"
          >
            View Product Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainerHeader;
