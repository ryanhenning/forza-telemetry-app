export interface TelemetryPayload {
  isRaceOn: boolean;
  timestampMs: number;
  engineMaxRpm: number;
  engineIdleRpm: number;
  currentEngineRpm: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  angularVelocityX: number;
  angularVelocityY: number;
  angularVelocityZ: number;
  yaw: number;
  pitch: number;
  roll: number;
  normalizedSuspensionTravelFrontLeft: number;
  normalizedSuspensionTravelFrontRight: number;
  normalizedSuspensionTravelRearLeft: number;
  normalizedSuspensionTravelRearRight: number;
  tireSlipRatioFrontLeft: number;
  tireSlipRatioFrontRight: number;
  tireSlipRatioRearLeft: number;
  tireSlipRatioRearRight: number;
  wheelRotationSpeedFrontLeft: number;
  wheelRotationSpeedFrontRight: number;
  wheelRotationSpeedRearLeft: number;
  wheelRotationSpeedRearRight: number;
  wheelOnRumbleStripFrontLeft: number;
  wheelOnRumbleStripFrontRight: number;
  wheelOnRumbleStripRearLeft: number;
  wheelOnRumbleStripRearRight: number;
  wheelInPuddleDepthFrontLeft: number;
  wheelInPuddleDepthFrontRight: number;
  wheelInPuddleDepthRearLeft: number;
  wheelInPuddleDepthRearRight: number;
  surfaceRumbleFrontLeft: number;
  surfaceRumbleFrontRight: number;
  surfaceRumbleRearLeft: number;
  surfaceRumbleRearRight: number;
  tireSlipAngleFrontLeft: number;
  tireSlipAngleFrontRight: number;
  tireSlipAngleRearLeft: number;
  tireSlipAngleRearRight: number;
  tireCombinedSlipFrontLeft: number;
  tireCombinedSlipFrontRight: number;
  tireCombinedSlipRearLeft: number;
  tireCombinedSlipRearRight: number;
  suspensionTravelMetersFrontLeft: number;
  suspensionTravelMetersFrontRight: number;
  suspensionTravelMetersRearLeft: number;
  suspensionTravelMetersRearRight: number;
  carOrdinal: number;
  carClass: number;
  carPerformanceIndex: number;
  drivetrainType: number;
  numCylinders: number;
  carCategory: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  speed: number; // m/s
  power: number; // watts
  torque: number; // N-m
  tireTempFrontLeft: number;
  tireTempFrontRight: number;
  tireTempRearLeft: number;
  tireTempRearRight: number;
  boost: number;
  fuel: number;
  distanceTraveled: number;
  bestLap: number;
  lastLap: number;
  currentLap: number;
  currentRaceTime: number;
  lapNumber: number;
  racePosition: number;
  accel: number; // 0..255
  brake: number; // 0..255
  clutch: number; // 0..255
  handBrake: number; // 0..255
  gear: number; // 0=R, 1=N, 2=1st...
  steer: number; // -127..127
  normalizedDrivingLine: number;
  normalizedAiBrakeDifference: number;
}

export interface SessionSummary {
  id: string;
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  durationSeconds: number;
  maxSpeedMps: number;
  avgSpeedMps: number;
  maxRpm: number;
  totalDistanceMeters: number;
  leadFootIndex: number; // 0..1
  carOrdinal: number;
  carClass: number;
  carPerformanceIndex: number;
  drivetrainType: number;
  numCylinders: number;
  maxGear: number;
}
