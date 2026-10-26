// Labels and colours for showing a car, shared by the car grid and the car details page.

export const TAG_COLORS = {
  SUV: "#8b5cf6",
  Luxury: "#f59e0b",
  Family: "#10b981",
  Sports: "#ef4444",
  Economy: "#6b7280",
  Convertible: "#06b6d4",
  Van: "#3b82f6",
  Truck: "#f97316",
};

export const fuelEmoji = { PETROL: "⛽", DIESEL: "🛢️", HYBRID: "🔋", ELECTRICITY: "⚡" };

// "PETROL" -> "Petrol"
export function formatFuel(fuel) {
  return fuel ? fuel.charAt(0) + fuel.slice(1).toLowerCase() : "—";
}
