export interface Vehicle {
  id: number;
  vehicle_code: string;
  model: string | null;
  created_at: string;
}

export interface VehicleDetail extends Vehicle {
  total_records: number;
}

export interface TelemetryRecord {
  id: number;
  vehicle_id: number;
  timestamp: string;
  engine_coolant_temp: number | null;
  intake_manifold_pressure: number | null;
  engine_rpm: number | null;
  vehicle_speed: number | null;
  intake_air_temp: number | null;
  air_flow_rate: number | null;
  throttle_position: number | null;
  ambient_air_temp: number | null;
  accelerator_pedal_d: number | null;
  accelerator_pedal_e: number | null;
}

export interface PaginatedTelemetry {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: TelemetryRecord[];
}

export interface TelemetryStats {
  vehicle_id: number;
  vehicle_code: string;
  total_records: number;
  avg_speed: number | null;
  max_speed: number | null;
  avg_rpm: number | null;
  max_rpm: number | null;
  avg_coolant_temp: number | null;
  max_coolant_temp: number | null;
}