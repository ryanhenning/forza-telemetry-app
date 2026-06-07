use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryPayload {
    pub is_race_on: bool,
    pub timestamp_ms: u32,
    pub engine_max_rpm: f32,
    pub engine_idle_rpm: f32,
    pub current_engine_rpm: f32,
    pub acceleration_x: f32,
    pub acceleration_y: f32,
    pub acceleration_z: f32,
    pub velocity_x: f32,
    pub velocity_y: f32,
    pub velocity_z: f32,
    pub angular_velocity_x: f32,
    pub angular_velocity_y: f32,
    pub angular_velocity_z: f32,
    pub yaw: f32,
    pub pitch: f32,
    pub roll: f32,
    pub normalized_suspension_travel_front_left: f32,
    pub normalized_suspension_travel_front_right: f32,
    pub normalized_suspension_travel_rear_left: f32,
    pub normalized_suspension_travel_rear_right: f32,
    pub tire_slip_ratio_front_left: f32,
    pub tire_slip_ratio_front_right: f32,
    pub tire_slip_ratio_rear_left: f32,
    pub tire_slip_ratio_rear_right: f32,
    pub wheel_rotation_speed_front_left: f32,
    pub wheel_rotation_speed_front_right: f32,
    pub wheel_rotation_speed_rear_left: f32,
    pub wheel_rotation_speed_rear_right: f32,
    pub wheel_on_rumble_strip_front_left: i32,
    pub wheel_on_rumble_strip_front_right: i32,
    pub wheel_on_rumble_strip_rear_left: i32,
    pub wheel_on_rumble_strip_rear_right: i32,
    pub wheel_in_puddle_depth_front_left: f32,
    pub wheel_in_puddle_depth_front_right: f32,
    pub wheel_in_puddle_depth_rear_left: f32,
    pub wheel_in_puddle_depth_rear_right: f32,
    pub surface_rumble_front_left: f32,
    pub surface_rumble_front_right: f32,
    pub surface_rumble_rear_left: f32,
    pub surface_rumble_rear_right: f32,
    pub tire_slip_angle_front_left: f32,
    pub tire_slip_angle_front_right: f32,
    pub tire_slip_angle_rear_left: f32,
    pub tire_slip_angle_rear_right: f32,
    pub tire_combined_slip_front_left: f32,
    pub tire_combined_slip_front_right: f32,
    pub tire_combined_slip_rear_left: f32,
    pub tire_combined_slip_rear_right: f32,
    pub suspension_travel_meters_front_left: f32,
    pub suspension_travel_meters_front_right: f32,
    pub suspension_travel_meters_rear_left: f32,
    pub suspension_travel_meters_rear_right: f32,
    pub car_ordinal: i32,
    pub car_class: i32,
    pub car_performance_index: i32,
    pub drivetrain_type: i32,
    pub num_cylinders: i32,
    pub car_category: i32,
    pub position_x: f32,
    pub position_y: f32,
    pub position_z: f32,
    pub speed: f32, // meters per second
    pub power: f32, // watts
    pub torque: f32, // Newton-meters
    pub tire_temp_front_left: f32,
    pub tire_temp_front_right: f32,
    pub tire_temp_rear_left: f32,
    pub tire_temp_rear_right: f32,
    pub boost: f32,
    pub fuel: f32,
    pub distance_traveled: f32,
    pub best_lap: f32,
    pub last_lap: f32,
    pub current_lap: f32,
    pub current_race_time: f32,
    pub lap_number: u16,
    pub race_position: u8,
    pub accel: u8, // 0..255
    pub brake: u8, // 0..255
    pub clutch: u8, // 0..255
    pub hand_brake: u8, // 0..255
    pub gear: u8, // 0=R, 1=N, 2=1st, 3=2nd...
    pub steer: i8, // -127..127
    pub normalized_driving_line: i8,
    pub normalized_ai_brake_difference: i8,
}

impl TelemetryPayload {
    pub fn parse(buffer: &[u8]) -> Self {
        // Read values with safe boundary checks and little-endian conversions.
        let read_f32 = |offset: usize| -> f32 {
            if offset + 4 <= buffer.len() {
                f32::from_le_bytes([buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3]])
            } else {
                0.0
            }
        };

        let read_i32 = |offset: usize| -> i32 {
            if offset + 4 <= buffer.len() {
                i32::from_le_bytes([buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3]])
            } else {
                0
            }
        };

        let read_u32 = |offset: usize| -> u32 {
            if offset + 4 <= buffer.len() {
                u32::from_le_bytes([buffer[offset], buffer[offset + 1], buffer[offset + 2], buffer[offset + 3]])
            } else {
                0
            }
        };

        let read_u16 = |offset: usize| -> u16 {
            if offset + 2 <= buffer.len() {
                u16::from_le_bytes([buffer[offset], buffer[offset + 1]])
            } else {
                0
            }
        };

        let read_u8 = |offset: usize| -> u8 {
            if offset < buffer.len() {
                buffer[offset]
            } else {
                0
            }
        };

        let read_i8 = |offset: usize| -> i8 {
            if offset < buffer.len() {
                buffer[offset] as i8
            } else {
                0
            }
        };

        Self {
            is_race_on: read_i32(0) != 0,
            timestamp_ms: read_u32(4),
            engine_max_rpm: read_f32(8),
            engine_idle_rpm: read_f32(12),
            current_engine_rpm: read_f32(16),
            acceleration_x: read_f32(20),
            acceleration_y: read_f32(24),
            acceleration_z: read_f32(28),
            velocity_x: read_f32(32),
            velocity_y: read_f32(36),
            velocity_z: read_f32(40),
            angular_velocity_x: read_f32(44),
            angular_velocity_y: read_f32(48),
            angular_velocity_z: read_f32(52),
            yaw: read_f32(56),
            pitch: read_f32(60),
            roll: read_f32(64),
            normalized_suspension_travel_front_left: read_f32(68),
            normalized_suspension_travel_front_right: read_f32(72),
            normalized_suspension_travel_rear_left: read_f32(76),
            normalized_suspension_travel_rear_right: read_f32(80),
            tire_slip_ratio_front_left: read_f32(84),
            tire_slip_ratio_front_right: read_f32(88),
            tire_slip_ratio_rear_left: read_f32(92),
            tire_slip_ratio_rear_right: read_f32(96),
            wheel_rotation_speed_front_left: read_f32(100),
            wheel_rotation_speed_front_right: read_f32(104),
            wheel_rotation_speed_rear_left: read_f32(108),
            wheel_rotation_speed_rear_right: read_f32(112),
            wheel_on_rumble_strip_front_left: read_i32(116),
            wheel_on_rumble_strip_front_right: read_i32(120),
            wheel_on_rumble_strip_rear_left: read_i32(124),
            wheel_on_rumble_strip_rear_right: read_i32(128),
            wheel_in_puddle_depth_front_left: read_f32(132),
            wheel_in_puddle_depth_front_right: read_f32(136),
            wheel_in_puddle_depth_rear_left: read_f32(140),
            wheel_in_puddle_depth_rear_right: read_f32(144),
            surface_rumble_front_left: read_f32(148),
            surface_rumble_front_right: read_f32(152),
            surface_rumble_rear_left: read_f32(156),
            surface_rumble_rear_right: read_f32(160),
            tire_slip_angle_front_left: read_f32(164),
            tire_slip_angle_front_right: read_f32(168),
            tire_slip_angle_rear_left: read_f32(172),
            tire_slip_angle_rear_right: read_f32(176),
            tire_combined_slip_front_left: read_f32(180),
            tire_combined_slip_front_right: read_f32(184),
            tire_combined_slip_rear_left: read_f32(188),
            tire_combined_slip_rear_right: read_f32(192),
            suspension_travel_meters_front_left: read_f32(196),
            suspension_travel_meters_front_right: read_f32(200),
            suspension_travel_meters_rear_left: read_f32(204),
            suspension_travel_meters_rear_right: read_f32(208),
            car_ordinal: read_i32(212),
            car_class: read_i32(216),
            car_performance_index: read_i32(220),
            drivetrain_type: read_i32(224),
            num_cylinders: read_i32(228),
            car_category: read_i32(232),
            position_x: read_f32(244),
            position_y: read_f32(248),
            position_z: read_f32(252),
            speed: read_f32(256),
            power: read_f32(260),
            torque: read_f32(264),
            tire_temp_front_left: read_f32(268),
            tire_temp_front_right: read_f32(272),
            tire_temp_rear_left: read_f32(276),
            tire_temp_rear_right: read_f32(280),
            boost: read_f32(284),
            fuel: read_f32(288),
            distance_traveled: read_f32(292),
            best_lap: read_f32(296),
            last_lap: read_f32(300),
            current_lap: read_f32(304),
            current_race_time: read_f32(308),
            lap_number: read_u16(312),
            race_position: read_u8(314),
            accel: read_u8(315),
            brake: read_u8(316),
            clutch: read_u8(317),
            hand_brake: read_u8(318),
            gear: read_u8(319),
            steer: read_i8(320),
            normalized_driving_line: read_i8(321),
            normalized_ai_brake_difference: read_i8(322),
        }
    }
}
