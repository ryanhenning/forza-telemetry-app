use crate::telemetry::TelemetryPayload;
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummary {
    pub id: String,
    pub start_time: u64, // Epoch milliseconds
    pub end_time: u64,   // Epoch milliseconds
    pub duration_seconds: f64,
    pub max_speed_mps: f32,
    pub avg_speed_mps: f32,
    pub max_rpm: f32,
    pub total_distance_meters: f32,
    pub lead_foot_index: f32, // fraction 0..1 of time spent at throttle >= 250
    pub car_ordinal: i32,
    pub car_class: i32,
    pub car_performance_index: i32,
    pub drivetrain_type: i32,
    pub num_cylinders: i32,
    pub max_gear: u8,
}

pub struct ActiveSession {
    pub start_time: u64, // epoch ms
    pub last_packet_time: u64, // epoch ms
    pub packet_count: usize,
    pub lead_foot_packets: usize,
    pub speeds: Vec<f32>,
    pub max_speed: f32,
    pub max_rpm: f32,
    pub total_distance: f32,
    pub last_pos: Option<(f32, f32, f32)>,
    pub last_race_time: f32,
    pub car_ordinal: i32,
    pub car_class: i32,
    pub car_performance_index: i32,
    pub drivetrain_type: i32,
    pub num_cylinders: i32,
    pub max_gear: u8,
}

impl ActiveSession {
    pub fn new(packet: &TelemetryPayload) -> Self {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        let pos = Some((packet.position_x, packet.position_y, packet.position_z));
        
        Self {
            start_time: now,
            last_packet_time: now,
            packet_count: 1,
            lead_foot_packets: if packet.accel >= 250 { 1 } else { 0 },
            speeds: vec![packet.speed],
            max_speed: packet.speed,
            max_rpm: packet.current_engine_rpm,
            total_distance: 0.0,
            last_pos: pos,
            last_race_time: packet.current_race_time,
            car_ordinal: packet.car_ordinal,
            car_class: packet.car_class,
            car_performance_index: packet.car_performance_index,
            drivetrain_type: packet.drivetrain_type,
            num_cylinders: packet.num_cylinders,
            max_gear: packet.gear,
        }
    }

    pub fn update(&mut self, packet: &TelemetryPayload) {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        self.last_packet_time = now;
        self.packet_count += 1;
        self.last_race_time = packet.current_race_time;
        
        if packet.accel >= 250 {
            self.lead_foot_packets += 1;
        }

        self.speeds.push(packet.speed);
        if packet.speed > self.max_speed {
            self.max_speed = packet.speed;
        }
        if packet.current_engine_rpm > self.max_rpm {
            self.max_rpm = packet.current_engine_rpm;
        }
        if packet.gear > self.max_gear {
            self.max_gear = packet.gear;
        }

        // Calculate distance via coordinate displacement (with protection against telemetry jumps)
        let curr_pos = (packet.position_x, packet.position_y, packet.position_z);
        if let Some(prev_pos) = self.last_pos {
            let dx = curr_pos.0 - prev_pos.0;
            let dy = curr_pos.1 - prev_pos.1;
            let dz = curr_pos.2 - prev_pos.2;
            let dist = (dx * dx + dy * dy + dz * dz).sqrt();
            // Discard jumps larger than 100 meters (teleporting, loading, etc.)
            if dist < 100.0 {
                self.total_distance += dist;
            }
        }
        self.last_pos = Some(curr_pos);
    }

    pub fn to_summary(&self) -> SessionSummary {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        let duration_ms = now.saturating_sub(self.start_time);
        let duration_seconds = (duration_ms as f64) / 1000.0;
        
        let avg_speed = if self.speeds.is_empty() {
            0.0
        } else {
            self.speeds.iter().sum::<f32>() / (self.speeds.len() as f32)
        };

        let lead_foot_index = if self.packet_count > 0 {
            (self.lead_foot_packets as f32) / (self.packet_count as f32)
        } else {
            0.0
        };

        SessionSummary {
            id: format!("{}-{}", self.start_time, self.car_ordinal),
            start_time: self.start_time,
            end_time: now,
            duration_seconds,
            max_speed_mps: self.max_speed,
            avg_speed_mps: avg_speed,
            max_rpm: self.max_rpm,
            total_distance_meters: self.total_distance,
            lead_foot_index,
            car_ordinal: self.car_ordinal,
            car_class: self.car_class,
            car_performance_index: self.car_performance_index,
            drivetrain_type: self.drivetrain_type,
            num_cylinders: self.num_cylinders,
            max_gear: self.max_gear,
        }
    }
}

pub fn save_session(app_data_path: &PathBuf, summary: &SessionSummary) -> Result<(), String> {
    let mut sessions_path = app_data_path.clone();
    sessions_path.push("sessions");
    if !sessions_path.exists() {
        fs::create_dir_all(&sessions_path).map_err(|e| e.to_string())?;
    }
    
    let file_name = format!("{}.json", summary.id);
    let mut file_path = sessions_path;
    file_path.push(file_name);
    
    let json = serde_json::to_string_pretty(summary).map_err(|e| e.to_string())?;
    fs::write(file_path, json).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_all_sessions(app_data_path: &PathBuf) -> Result<Vec<SessionSummary>, String> {
    let mut sessions_path = app_data_path.clone();
    sessions_path.push("sessions");
    if !sessions_path.exists() {
        return Ok(Vec::new());
    }

    let mut sessions = Vec::new();
    let entries = fs::read_dir(sessions_path).map_err(|e| e.to_string())?;
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(summary) = serde_json::from_str::<SessionSummary>(&content) {
                        sessions.push(summary);
                    }
                }
            }
        }
    }
    
    // Sort descending by start_time (most recent first)
    sessions.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    Ok(sessions)
}
