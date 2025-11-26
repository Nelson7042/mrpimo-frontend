import React, { useState } from "react";
import { ArrowRight, Copy, Search } from "lucide-react";
import Pagination from "./Pagination";

export type Transaction = {
  id: string;
  type: string;
  amount: number;
  token: string;
  date: string;
  address: string;
  status: string;
  hash?: string;
};

type TransactionTableProps = {
  title: string;
  transactions: Transaction[];
  copyToClipboard: (text: string) => void;
  itemsPerPage?: number;
};

const TransactionTable = ({
  title,
  transactions,
  copyToClipboard,
  itemsPerPage = 5,
}: TransactionTableProps) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  React.useEffect(() => {
    const total = Math.ceil(transactions.length / itemsPerPage);
    setTotalPages(total);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayedTransactions(
      transactions.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage)
    );
  }, [currentPage, itemsPerPage, transactions]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="grid grid-cols-6 xl:grid-cols-12 gap-5 mt-5 px-4">
        <div className="relative col-span-6 xl:col-span-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search transactions"
          />
        </div>

        <div className="relative col-span-6 md:col-span-3">
          <input
            type="date"
            className="border border-gray-200 rounded-md px-3 py-2 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="relative col-span-6 md:col-span-3 md:justify-self-center">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl">
            Export Transactions
          </button>
        </div>
      </div>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button className="flex cursor-pointer text-sm text-indigo-600 items-center">
          <div>View All</div>
          <ArrowRight size={16} className="ml-1" />
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
              >
                Transaction ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
              >
                Address
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                  {tx.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                  {tx.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  <span
                    className={
                      tx.type === "receive" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {tx.type === "receive" ? "+" : "-"}
                    {tx.amount} {tx.token}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === "receive"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tx.type === "receive" ? "Receive" : "Send"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                  <div className="flex items-center">
                    <span className="truncate max-w-[150px]">
                      {tx.address}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tx.address)}
                      className="ml-2 text-gray-400 hover:text-indigo-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      tx.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : tx.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Transaction List */}
      <div className="md:hidden">
        {displayedTransactions.map((tx) => (
          <div
            key={tx.id}
            className="p-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-900">{tx.id}</p>
                <p className="text-xs text-gray-500">{tx.date}</p>
              </div>
              <span
                className={`font-medium ${
                  tx.type === "receive" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "receive" ? "+" : "-"}
                {tx.amount} {tx.token}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                  {tx.address}
                </p>
                <button
                  onClick={() => copyToClipboard(tx.address)}
                  className="ml-1 text-gray-400"
                >
                  <Copy size={12} />
                </button>
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  tx.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : tx.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  tx.type === "receive"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {tx.type === "receive" ? "Receive" : "Send"}
              </span>
              <button className="text-xs text-indigo-600">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={transactions.length}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default TransactionTable;