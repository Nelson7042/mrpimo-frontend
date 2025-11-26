import React from "react";
import { ArrowDown, ArrowUp, CircleDollarSign, Landmark } from "lucide-react";

const FiatWalletCard = () => {
  return (
    <div className="w-full bg-white rounded-xl p-3 lg:p-6 shadow-lg text-gray-600 mb-5">
      <div className="flex flex-col gap-y-4">
        <h3 className="font-semibold text-lg">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="flex md:flex-col lg:flex-row xl:flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <ArrowDown className="text-blue-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Deposit</span>
          </button>
          <button className="flex md:flex-col lg:flex-row xl:flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <ArrowUp className="text-blue-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Withdraw</span>
          </button>
          <button className="flex md:flex-col lg:flex-row xl:flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <CircleDollarSign className="text-blue-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Convert</span>
          </button>
          <button className="flex md:flex-col lg:flex-row xl:flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <Landmark className="text-blue-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Bank</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiatWalletCard;