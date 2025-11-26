const baseConfig = {
  position: "top-right" as const,
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored" as const,
};

export const toastConfigError = {
  ...baseConfig,
  className: "!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !shadow-lg !border-l-4 !border-red-300",
};

export const toastConfigSuccess = {
  ...baseConfig,
  className: "!bg-gradient-to-r !from-emerald-500 !to-green-600 !text-white !shadow-lg !border-l-4 !border-emerald-300",
};

export const toastConfigInfo = {
  ...baseConfig,
  className: "!bg-gradient-to-r !from-blue-500 !to-indigo-600 !text-white !shadow-lg !border-l-4 !border-blue-300",
};

export const toastConfigWarning = {
  ...baseConfig,
  className: "!bg-gradient-to-r !from-amber-500 !to-orange-600 !text-white !shadow-lg !border-l-4 !border-amber-300",
};
