import React from "react";

type Props = {};

const Successful = (props: Props) => {
  return (
    <div className="bg-[#f4faf7] rounded-full size-30 flex items-center justify-center">
      <div className="flex rounded-full bg-[#ddecee] size-24 items-center justify-center">
        <div className="rounded-full bg-[#9fced4] size-18 flex items-center justify-center">
          <div className="rounded-full bg-[#5187f6] size-12 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Successful;
