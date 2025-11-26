import React from "react";

interface SelectOption {
  value: string;
  name: string;
}

interface InputProps {
  data: SelectOption[];
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  type?: string;
}

export const SelectInput: React.FC<InputProps> = ({
  data,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
}) => {
  return (
    <div className="">
      <select
        value={value}
        aria-placeholder={placeholder}
        onChange={onChange}
        className="bg-[#E2E8F0] w-full rounded-lg py-2 md:py-3 px-2 md:px-3 outline-none text-[#21212180] text-sm"
      >
        {data?.map((item) => (
          <option value={item?.value}>{item?.name}</option>
        ))}
      </select>
    </div>
  );
};
