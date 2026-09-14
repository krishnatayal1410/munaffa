export type HospitalityType =
  | "hotel"
  | "restaurant"
  | "cafe"
  | "qsr"
  | "cloud-kitchen"
  | "resort"
  | "bar-lounge"
  | "other";

export type Role = "owner" | "manager" | "front-desk" | "cashier" | "waiter" | "kitchen" | "inventory";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  organizationName?: string;
  hospitalityType?: HospitalityType;
  role?: Role;
  onboardingComplete?: boolean;
};

export type Outlet = {
  id: string;
  name: string;
  type: HospitalityType;
  city: string;
};

export type Metric = {
  label: string;
  value: string;
  change?: string;
  tone?: "positive" | "warning" | "neutral";
};
