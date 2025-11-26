import React, { useState } from "react";

const tailwindColorMap: Record<string, Record<string, string>> = {
  "bg-red": {
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
    "800": "#991b1b",
    "900": "#7f1d1d",
  },
  "bg-blue": {
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
    "800": "#1e40af",
    "900": "#1e3a8a",
  },
  "bg-green": {
    "100": "#dcfce7",
    "200": "#bbf7d0",
    "300": "#86efac",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
    "700": "#15803d",
    "800": "#166534",
    "900": "#14532d",
  },
  "bg-yellow": {
    "100": "#fef9c3",
    "200": "#fef08a",
    "300": "#fde047",
    "400": "#facc15",
    "500": "#eab308",
    "600": "#ca8a04",
    "700": "#a16207",
    "800": "#854d0e",
    "900": "#713f12",
  },
  "bg-purple": {
    "100": "#f3e8ff",
    "200": "#e9d5ff",
    "300": "#d8b4fe",
    "400": "#c084fc",
    "500": "#a855f7",
    "600": "#9333ea",
    "700": "#7e22ce",
    "800": "#6b21a8",
    "900": "#581c87",
  },
  "bg-orange": {
    "100": "#ffedd5",
    "200": "#fed7aa",
    "300": "#fdba74",
    "400": "#fb923c",
    "500": "#f97316",
    "600": "#ea580c",
    "700": "#c2410c",
    "800": "#9a3412",
    "900": "#7c2d12",
  },
  "bg-teal": {
    "100": "#ccfbf1",
    "200": "#99f6e4",
    "300": "#5eead4",
    "400": "#2dd4bf",
    "500": "#14b8a6",
    "600": "#0d9488",
    "700": "#0f766e",
    "800": "#115e59",
    "900": "#134e4a",
  },
  "bg-gray": {
    "100": "#f3f4f6",
    "200": "#e5e7eb",
    "300": "#d1d5db",
    "400": "#9ca3af",
    "500": "#6b7280",
    "600": "#4b5563",
    "700": "#374151",
    "800": "#1f2937",
    "900": "#111827",
  },
  "bg-black": {
    "100": "#000000",
    "200": "#000000",
    "300": "#000000",
    "400": "#000000",
    "500": "#000000",
    "600": "#000000",
    "700": "#000000",
    "800": "#000000",
    "900": "#000000",
  },
  "bg-white": {
    "100": "#ffffff",
    "200": "#ffffff",
    "300": "#ffffff",
    "400": "#ffffff",
    "500": "#ffffff",
    "600": "#ffffff",
    "700": "#ffffff",
    "800": "#ffffff",
    "900": "#ffffff",
  },
};

interface Props {
  selectedColors: string[];
  onChange: (colors: string[]) => void;
  maxSelection?: number;
}

export default function ColorPicker({ selectedColors, onChange, maxSelection }: Props) {
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedShade, setSelectedShade] = useState<string>("");

  const mainColors = [
    "bg-yellow-500",
    "bg-blue-500",
    "bg-red-500",
    "bg-green-500",
    "bg-black",
    "bg-white",
    "bg-gray-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-teal-500",
  ];
  const shades = [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ];

  const handleColorSelection = (color: string) => {
    setSelectedColor(color);
    if (color === "bg-white") {
      const newColor = "#ffffff";
      if (maxSelection === 1) {
        onChange([newColor]);
      } else if (!selectedColors.includes(newColor)) {
        onChange([...selectedColors, newColor]);
      }
    } else if (color === "bg-black") {
      const newColor = "#000000";
      if (maxSelection === 1) {
        onChange([newColor]);
      } else if (!selectedColors.includes(newColor)) {
        onChange([...selectedColors, newColor]);
      }
    }
    setSelectedShade("");
  };

  const handleShadeSelection = (shade: string) => {
    setSelectedShade(shade);
    const baseColor = selectedColor.split("-").slice(0, -1).join("-");
    const hexColor = tailwindColorMap[baseColor]?.[shade];
    if (hexColor) {
      if (maxSelection === 1) {
        onChange([hexColor]);
      } else if (!selectedColors.includes(hexColor)) {
        onChange([...selectedColors, hexColor]);
      }
    }
  };

  const removeColor = (colorToRemove: string) => {
    onChange(selectedColors.filter((c) => c !== colorToRemove));
  };

  return (
    <>
      <p className="text-[12px] mt-4">Select colour</p>
      <div className="flex flex-col gap-2 mt-2">
        {/* Main colors row */}
        <div className="flex flex-wrap gap-2">
          {mainColors.map((color) => (
            <div
              key={color}
              className={`w-6 h-6 rounded-full cursor-pointer ${
                color === "bg-white" ? "border border-gray-400" : ""
              } ${color} ${
                selectedColor === color
                  ? "ring-2 ring-offset-2 ring-blue-500"
                  : ""
              }`}
              onClick={() => handleColorSelection(color)}
            />
          ))}
        </div>

        {/* Shades row - only show if a main color is selected */}
        {selectedColor && (
          <div className="flex gap-2">
            {shades.map((shade) => {
              const colorName = selectedColor.split("-")[1];

              if (
                selectedColor === "bg-black" ||
                selectedColor === "bg-white"
              ) {
                return null;
              }

              return (
                <div
                  key={shade}
                  className={`w-6 h-6 rounded-full cursor-pointer border ${
                    selectedShade === shade
                      ? "border-black border-2"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor:
                      tailwindColorMap[`bg-${colorName}`]?.[shade] || "",
                  }}
                  onClick={() => handleShadeSelection(shade)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Selected colors display */}
      {selectedColors.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] mb-2">Selected colors:</p>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{color}</span>
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="text-red-500 hover:text-red-700 text-xs ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
