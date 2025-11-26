import { getCurrencySymbol } from "@/utils/currency";



type PlanCardProps = {
  plan: any;
  selectedPlan: any;
  setSelectedPlan: (plan: any) => void;
};

const PlanCard = (props: PlanCardProps) => {
  return (
    <div className="border border-white bg-white rounded-md p-2">
      <div className="flex flex-col gap-y-4 bg-[#adcaf2] rounded-md p-2">
        <div className="inline-flex items-center bg-white rounded-full p-1 w-fit">
          <p className="text-[10px]">{props.plan.name}</p>
        </div>

        <p className="text-sm">
          {getCurrencySymbol(props.plan.currency)}{" "}
          {props.plan.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          / Month
        </p>
      </div>
      <div className="mt-8 mb-4">
        <button
          onClick={() => props.setSelectedPlan(props.plan)}
          className="bg-[#004aad] text-white rounded-md cursor-pointer py-1 text-xs w-full text-center mb-2"
        >
          {props.selectedPlan?.name === props.plan.name
            ? "Selected"
            : "Upgrade"}
        </button>
      </div>
      <div className="mt-2">
        {props.plan.priviledges.map((priviledge: string, index: number) => {
          return (
            <div
              className="flex gap-x-2 items-center mb-2"
              key={`${props.plan.name}-${index}`}
            >
              <input type="checkbox" name="" id="" defaultChecked readOnly />
              <p className="text-[10px]">{priviledge}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default PlanCard