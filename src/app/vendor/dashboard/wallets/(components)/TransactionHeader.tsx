import React from "react";
import { ArrowRight, Download, Calendar, Search } from "lucide-react";

type TransactionHeaderProps = {
  onDateChange: (date: string) => void;
  onDownload: () => void;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
};

const TransactionHeader = ({
  onDateChange,
  onDownload,
  searchTerm,
  setSearchTerm,
}: TransactionHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-4  w-full mt-2">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="search"
          className="block pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-sm md:w-[100%] lg:w-sm xl:w-lg"
          placeholder="Search transactions"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-x-2 items-center justify-between md:justify-end  w-full">
        <div className="relative">
          <input
            type="date"
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-blue-400 transition-colors cursor-pointer bg-white shadow-sm font-mono"
            onChange={(e) => onDateChange(e.target.value)}
          />
          <Calendar
            size={16}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-500"
          />
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100"
        >
          <Download size={16} />
          <span>Statement</span>
        </button>
      </div>
    </div>
  );
};

export default TransactionHeader;
