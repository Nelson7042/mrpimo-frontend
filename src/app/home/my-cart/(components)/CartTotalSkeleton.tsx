

const CartTotalSkeleton = () => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-md shadow-sm p-4 animate-pulse">
        <h3 className="font-semibold text-center text-lg mb-4">Cart Total</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="bg-gray-200 h-4 w-24 rounded"></span>
            <span className="bg-gray-200 h-4 w-20 rounded"></span>
          </div>
          <div className="flex justify-between">
            <span className="bg-gray-200 h-4 w-24 rounded"></span>
            <span className="bg-gray-200 h-4 w-20 rounded"></span>
          </div>
          <div className="flex justify-between">
            <span className="bg-gray-200 h-4 w-24 rounded"></span>
            <span className="bg-gray-200 h-4 w-20 rounded"></span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span className="bg-gray-300 h-5 w-24 rounded"></span>
            <span className="bg-gray-300 h-5 w-20 rounded"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartTotalSkeleton;