import React, { useState } from "react";
import { CreditCard, CircleDollarSign, Plus, ArrowDown, ArrowUp, ArrowRight, ArrowDownRight, ArrowUpRight } from "lucide-react";
import FiatWalletCard from "./FiatWalletCard";
import Pagination from "./Pagination";
import TransactionHeader from "./TransactionHeader";
import AccountDetailsCard from "./AccountDetailsCard";
import Link from "next/link";
import { useResponsive } from "@/hooks/useResponsive";

type Transaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  date: string;
  description: string;
  status: "completed" | "pending" | "failed";
};

type FiatWalletProps = {
  transactions: Transaction[];
};

const FiatWallet = ({ transactions }: FiatWalletProps) => {
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const {isMobile} = useResponsive();

  // Filter transactions based on search term and date
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = filterDate ? tx.date === filterDate : true;

    return matchesSearch && matchesDate;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div>
      {/* Wallet Balance Card */}
      <div className="grid md:grid-cols-6 xl:grid-cols-12 gap-y-5 xl:gap-x-5 mb-8 fiat-card">
        <div className="w-full md:col-span-8 bg-white rounded-xl p-2 sm:p-6 shadow-lg text-gray-600 order-2 xl:order-1">
          <div className="flex flex-col gap-y-5">
            <div>
              <p className="text-gray-800 mb-1">Available Balance</p>
              <div className="relative w-80">
                <h2 className="text-gray-600 text-2xl md:text-3xl font-semibold">
                  £8,350.50
                </h2>
                <p className="text-green-500 text-xs absolute top-4 left-[40%] md:left-[50%]">
                  + £2,000.00 this month
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-y-4 md:gap-x-10 md:items-center">
              <div className="bg-gray-100 text-gray-800 px-5 py-2 pb-5 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2 border border-blue-300 shadow-sm">
                <div className="relative bg-blue-50 rounded-full h-10 w-10 flex items-center justify-center">
                  <CreditCard size={24} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-sm">Pending Withdrawal</p>
                  <p className="text-gray-500 text-xl">£1,500.00</p>
                </div>
              </div>
              <div className="bg-gray-100 text-gray-800 px-5 py-2 pb-5 rounded-lg font-medium hover:bg-blue-50 border border-blue-300 shadow-sm transition-colors flex items-center gap-2">
                <div className="relative bg-blue-50 rounded-full h-10 w-10 flex items-center justify-center">
                  <CircleDollarSign size={24} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm">Monthly Earnings</p>
                  <p className="text-gray-500 text-xl">£10,500.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="w-full md:col-span-6 xl:col-span-4 order-1 xl:order-2">
          <div className="p-2 border rounded-lg border-blue-300 bg-white">
            <div className="flex justify-between items-center pb-3 border-b border-gray-300">
              <h1 className="text-lg text-gray-500">Payment Methods</h1>
              <button className="flex items-center text-green-800">
                <Plus size={16} />
                <p className="ml-1 text-md">Add New</p>
              </button>
            </div>
            <AccountDetailsCard
              accountDetails={"Access Bank 072****813"}
              default={true}
            />
            <AccountDetailsCard accountDetails={"Access Bank 072****813"} />
          </div>
        </div>
        {/* Quick Actions */}
      </div>
      <FiatWalletCard />
      {/* Transactions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1>Transaction History</h1>
          <Link
            href={"/vendor/dashboard/wallets/transactions"}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>
        <TransactionHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onDateChange={(date) => setFilterDate(date)}
          onDownload={() => {
            // Logic to download statement
            alert("Downloading statement...");
          }}
        />

        {/* Search */}

        {/* Transactions Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transaction ID
                </th>
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
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center">
                      {transaction.type === "credit" ? (
                        <ArrowDown size={16} className="mr-1 text-green-500" />
                      ) : (
                        <ArrowUp size={16} className="mr-1 text-red-500" />
                      )}
                      <span
                        className={
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "credit" ? "+" : "-"} £
                        {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
        {displayedTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === 'credit' ? (
                    <ArrowDownRight className="text-green-600" size={16} />
                  ) : (
                    <ArrowUpRight className="text-red-600" size={16} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-xs">{transaction.description}</p>
                </div>
              </div>
              <div className={`text-right ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                <p className="font-semibold">{transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
              <span className={`text-xs px-2 py-1 rounded-full ${
                transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {transaction.status}
              </span>
              <button className="text-xs text-blue-600">View Details</button>
            </div>
          </div>
        ))}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredTransactions.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default FiatWallet;
