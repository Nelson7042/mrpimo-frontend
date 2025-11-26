import { Landmark } from "lucide-react";
import React from "react";

type Props = {
  accountDetails: string;
  default?: boolean;
};

const AccountDetailsCard: React.FC<Props> = ({
  accountDetails,
  default: isDefault = false,
}) => {
  return (
    <div className="flex flex-col mt-4 gap-y-4">
      <div className="flex py-3 pl-4 pr-1 justify-between border rounded-lg border-blue-300">
        <div className="flex gap-x-2 items-center w-full">
          <div className="relative bg-blue-50 rounded-full h-10 w-10 flex items-center justify-center">
            <Landmark size={24} className="text-blue-300" />
          </div>
          <div className="w-full">
            <div className="flex justify-between items-center w-full pr-2">
              <h1>Bank Account</h1>
              {isDefault && (
                <div className="bg-green-100 text-green-800 p-1 text-xs rounded-md">
                  Default
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">{accountDetails}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsCard;
