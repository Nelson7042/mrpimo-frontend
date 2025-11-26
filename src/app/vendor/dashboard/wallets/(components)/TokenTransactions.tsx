import React, { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { format } from "date-fns";
import Pagination from "./Pagination";
import TransactionHeader from "./TransactionHeader";

type Transaction = {
  amount: string;
  type: "incoming" | "outgoing";
  createdAt: string;
};

type TokenTransactionsProps = {
  tokenSymbol: string;
  transactions: Transaction[];
  isLoading?: boolean;
};

const TokenTransactions = ({
  tokenSymbol,
  transactions,
  isLoading = false,
}: TokenTransactionsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.amount.includes(searchTerm) ||
      tx.type.includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">{tokenSymbol} Transactions</h2>
      {/* Transactions Table */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading transactions...</p>
        </div>
      ) : paginatedTransactions.length > 0 ? (
        <>
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === "incoming"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.type === "incoming" ? (
                            <ArrowDownLeft size={14} className="mr-1" />
                          ) : (
                            <ArrowUpRight size={14} className="mr-1" />
                          )}
                          {tx.type === "incoming" ? "Received" : "Sent"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          tx.type === "incoming"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {tx.type === "incoming" ? "+" : "-"} {tx.amount}{" "}
                        {tokenSymbol}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden">
            {paginatedTransactions.map((tx, index) => (
              <div
                key={index}
                className="border-b border-gray-200 py-3 last:border-b-0"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">
                    {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                  </span>
                  <span
                    className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === "incoming"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tx.type === "incoming" ? (
                      <ArrowDownLeft size={12} className="mr-1" />
                    ) : (
                      <ArrowUpRight size={12} className="mr-1" />
                    )}
                    {tx.type === "incoming" ? "Received" : "Sent"}
                  </span>
                </div>
                <div className="text-sm font-medium">
                  <span
                    className={
                      tx.type === "incoming" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {tx.type === "incoming" ? "+" : "-"} {tx.amount}{" "}
                    {tokenSymbol}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTransactions.length}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default TokenTransactions;
