import { ArrowRight } from "lucide-react";
import React from "react";

type Props = {};

interface ReviewType {
  itemId: string;
  customer: string;
  date: string;
  rate: number;
  review: string;
}

const reviews: ReviewType[] = [
  {
    itemId: "ORD-001",
    customer: "John Doe",
    rate: 4.9,
    date: "2023-11-15",
    review: "The bag was exactly what I reviewed for, I really love it. T...",
  },
  {
    itemId: "ORD-002",
    customer: "Jane Smith",
    rate: 4.5,
    date: "2023-11-18",
    review: "The item came neatly packed.",
  },
  {
    itemId: "ORD-003",
    customer: "Robert Johnson",
    rate: 4.7,
    date: "2023-11-20",
    review: "I really do not like my shoes, they are not my size, can I....",
  },
  {
    itemId: "ORD-004",
    customer: "Emily Davis",
    rate: 4.2,
    date: "2023-11-22",
    review: "The item came neatly packed.",
  },
  {
    itemId: "ORD-005",
    customer: "Michael Wilson",
    rate: 4.0,
    date: "2023-11-25",
    review: "The item came neatly packed.",
  },
  {
    itemId: "ORD-006",
    customer: "Sarah Brown",
    rate: 4.5,
    date: "2023-11-28",
    review: "The item came neatly packed.",
  },
];

const ReviewsTable = (props: Props) => {
  return (
    <div className="mt-8 rounded-lg shadow-sm p-2 md:p-4 lg:p-5 bg-white">
      <div className="flex flex-row justify-between items-center text-lg ">
        <h1>Recent Reviews</h1>
        <button className="flex cursor-pointer text-blue-600 items-center ">
          <div>View All</div>
          <ArrowRight size={16} className="ml-1" />
        </button>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-5">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="text-black breview-b breview-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Item ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Review
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <tr key={review.itemId} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {review.itemId}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {review.date}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {review.customer}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {review.rate}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                  {review.review}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  ...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewsTable;
