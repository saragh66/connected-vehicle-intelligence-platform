import { apiClient } from "./client";
import type { Vehicle, VehicleDetail, PaginatedTelemetry, TelemetryStats, HealthScore } from "../types/vehicle";

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

export async function getVehicleHealthScore(vehicleId: number): Promise<HealthScore> {
  const response = await apiClient.get<HealthScore>(`/vehicles/${vehicleId}/health-score`);
  return response.data;
}
export interface VehicleWithHealth {
  id: number;
  vehicle_code: string;
  model: string | null;
  total_records: number;
  anomaly_count: number;
  anomaly_rate: number;
  health_score: number;
}

export async function getVehiclesWithHealth(): Promise<VehicleWithHealth[]> {
  const response = await apiClient.get<VehicleWithHealth[]>("/vehicles/with-health");
  return response.data;
}