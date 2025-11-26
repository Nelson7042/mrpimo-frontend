import React from "react";
import Image from "next/image";
import { Copy } from "lucide-react";

type AddressItem = {
  symbol: string;
  iconPath: string;
  address: string;
  status: string;
};

type WalletAddressProps = {
  addresses: AddressItem[];
  copyToClipboard: (text: string) => void;
};

const WalletAddress = ({ addresses, copyToClipboard }: WalletAddressProps) => {
  return (
    <div className="p-4 border rounded-lg border-blue-300 bg-white">
      <div className="flex justify-between items-center pb-3 border-b border-gray-300">
        <h1 className="text-lg text-gray-700">Wallet Address</h1>
      </div>
      <div className="flex flex-col mt-4 gap-y-4">
        {addresses.map((item, index) => (
          <div 
            key={index}
            className={`p-4 border rounded-lg border-blue-200 bg-blue-50`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center">
                  <Image
                    src={item.iconPath}
                    width={24}
                    height={24}
                    alt={`${item.symbol} image`}
                    className="text-white"
                  />
                </div>
                <span className="font-medium">{item.symbol}</span>
              </div>
              <div className="bg-green-100 px-2 py-0.5 rounded-full">
                <p className="text-xs text-green-700">{item.status}</p>
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500 truncate w-48">
                {item.address}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => copyToClipboard(item.address)}
                  className="text-gray-500 hover:text-indigo-600"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletAddress;