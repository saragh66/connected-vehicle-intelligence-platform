import { apiClient } from "./client";
import type { Vehicle, VehicleDetail, PaginatedTelemetry, TelemetryStats } from "../types/vehicle";

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await apiClient.get<Vehicle[]>("/vehicles/");
  return response.data;
}

export async function getVehicleDetail(vehicleId: number): Promise<VehicleDetail> {
  const response = await apiClient.get<VehicleDetail>(`/vehicles/${vehicleId}`);
  return response.data;
}

export async function getVehicleTelemetry(
  vehicleId: number,
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedTelemetry> {
  const response = await apiClient.get<PaginatedTelemetry>(
    `/vehicles/${vehicleId}/telemetry`,
    { params: { page, page_size: pageSize } }
  );
  return response.data;
}

export async function getVehicleStats(vehicleId: number): Promise<TelemetryStats> {
  const response = await apiClient.get<TelemetryStats>(`/vehicles/${vehicleId}/stats`);
  return response.data;
}