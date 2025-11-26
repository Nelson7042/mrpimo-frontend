import FullButton from "@/components/FullButton";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const RecoverPass = () => {
  const [email, setEmail] = React.useState("");
 


  return (
    <form className="flex flex-col gap-[10px]">
      <div className="mb-[10px]">
        <div className="flex items-center justify-between">
          <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
            Email Address
          </label>
        </div>
        <div className=" relative    flex items-center">
          <input
            type={"email"}
            placeholder="Enter your email"
            className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px]  border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-[#26ae5f] focus:border-[#26ae5f] "
            required
            autoComplete="on"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </div>
      <div className="mb-4 md:mb-6 mt-4 md:mt-6">
        <FullButton action={() => {}} color="blue" name="Proceed" />
      </div>
    </form>
  );
};

export default RecoverPass;
