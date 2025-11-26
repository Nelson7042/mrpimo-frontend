import { getCurrencySymbol } from "@/utils/currency";
import { ArrowUp, ArrowDown } from "lucide-react";
import React from "react";

type Props = {
  title: string;
  value?: number;
  amount?: number;
  percentageIncrease?: {
    changeAmount: number;
    changePercent: number;
    currency?: string;
    previousAmount?: number;
  };
  currency?: string;
  period?: string;
};

const AnalyticsCard = (props: Props) => {
  return (
    <div className="bg-white p-8 md:p-6 rounded-lg shadow-sm w-full">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <p className="font-[family-name:var(--font-poppins)]">{props.title}</p>
        <svg
          width="20"
          height="16"
          viewBox="0 0 20 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.1334 0.799805C1.80792 0.799805 0.733398 1.87432 0.733398 3.1998V7.9998C0.733398 9.32529 1.80792 10.3998 3.1334 10.3998L3.1334 3.1998H15.1334C15.1334 1.87432 14.0589 0.799805 12.7334 0.799805H3.1334Z"
            fill="#B5B4B4"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.5334 7.9998C5.5334 6.67432 6.60792 5.5998 7.9334 5.5998H17.5334C18.8589 5.5998 19.9334 6.67432 19.9334 7.9998V12.7998C19.9334 14.1253 18.8589 15.1998 17.5334 15.1998H7.9334C6.60792 15.1998 5.5334 14.1253 5.5334 12.7998V7.9998ZM12.7334 12.7998C14.0589 12.7998 15.1334 11.7253 15.1334 10.3998C15.1334 9.07432 14.0589 7.9998 12.7334 7.9998C11.4079 7.9998 10.3334 9.07432 10.3334 10.3998C10.3334 11.7253 11.4079 12.7998 12.7334 12.7998Z"
            fill="#B5B4B4"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-y-2">
        <p className="font-[family-name:var(--font-alexandria)] text-[#211f1f] text-3xl">
          {props.currency && props.amount
            ? `${getCurrencySymbol(props.currency)} ${props.amount}`
            : props.value || 0}
        </p>
        {props.percentageIncrease && (
          <div className="flex gap-x-2 items-center">
          <div
            className={`font-[family-name:var(--font-poppins)] text-[#211f1f] px-2 py-1 rounded-full flex items-center ${
              (props.percentageIncrease?.changePercent || 0) >= 0
                ? "bg-[#a8ffdc]"
                : "bg-red-100"
            }`}
          >
            {(props.percentageIncrease?.changePercent || 0) >= 0 ? (
              <ArrowUp size={12} />
            ) : (
              <ArrowDown size={12} />
            )}
            <div className="text-xs ml-1">
              {props.percentageIncrease?.changePercent || 0}%
            </div>
          </div>
          <p className="text-black text-xs font-[family-name:var(--font-poppins)]">
            {props.period ? `${props.period}` : "Since last month"}
          </p>
        </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCard;
