import dgram from 'dgram';

const client = dgram.createSocket('udp4');

const PORT = 5300;
const HOST = '127.0.0.1';
const INTERVAL = 16.67; // 60 Hz

console.log(`Starting Forza UDP Telemetry Simulator on ${HOST}:${PORT} (60Hz)...`);

let time = 0;
let speed = 0; // m/s
let rpm = 1000;
let gear = 1; // 1 = N, 2 = 1st, 3 = 2nd...
let distance = 0;
let posX = 0;
let posZ = 0;

setInterval(() => {
  time += INTERVAL / 1000;

  // Simulate acceleration and gear shifting
  let accel = 255;
  let brake = 0;

  // Oscillating speed cycle (accelerate to max, brake to stop)
  const cycleTime = time % 30; // 30 second cycle
  if (cycleTime < 20) {
    // Accelerating
    accel = 255;
    brake = 0;
    speed += 0.25; // Accelerate
    if (speed > 70) speed = 70; // Cap speed at ~156 MPH
  } else {
    // Braking
    accel = 0;
    brake = 255;
    speed -= 0.6; // Decelerate
    if (speed < 0) speed = 0;
  }

  // Simple gear matching based on speed
  if (speed === 0) {
    gear = 1; // Neutral
    rpm = 1000;
  } else if (speed < 10) {
    gear = 2; // 1st
    rpm = 1000 + (speed / 10) * 5000;
  } else if (speed < 20) {
    gear = 3; // 2nd
    rpm = 2000 + ((speed - 10) / 10) * 4500;
  } else if (speed < 35) {
    gear = 4; // 3rd
    rpm = 2500 + ((speed - 20) / 15) * 4500;
  } else if (speed < 50) {
    gear = 5; // 4th
    rpm = 3000 + ((speed - 35) / 15) * 4000;
  } else {
    gear = 6; // 5th
    rpm = 3500 + ((speed - 50) / 20) * 3500;
  }

  // Calculate distance traveled
  const stepDistance = speed * (INTERVAL / 1000);
  distance += stepDistance;

  // Move in a circle (R = 500m)
  const angle = (distance / 500) % (2 * Math.PI);
  posX = Math.cos(angle) * 500;
  posZ = Math.sin(angle) * 500;

  // Simulate tire temps warming up with speed
  const tireTemp = 20.0 + (speed / 70.0) * 55.0 + Math.sin(time) * 2.0;

  // Create 324-byte buffer
  const buf = Buffer.alloc(324);

  // Write fields at correct offsets
  // s32 IsRaceOn (offset 0)
  buf.writeInt32LE(1, 0);
  // u32 TimestampMS (offset 4)
  buf.writeUInt32LE(Math.floor(time * 1000) & 0xffffffff, 4);
  // f32 EngineMaxRpm (offset 8)
  buf.writeFloatLE(8000.0, 8);
  // f32 EngineIdleRpm (offset 12)
  buf.writeFloatLE(1000.0, 12);
  // f32 CurrentEngineRpm (offset 16)
  buf.writeFloatLE(rpm, 16);

  // f32 PositionX (offset 244)
  buf.writeFloatLE(posX, 244);
  // f32 PositionY (offset 248)
  buf.writeFloatLE(100.0, 248);
  // f32 PositionZ (offset 252)
  buf.writeFloatLE(posZ, 252);
  // f32 Speed (offset 256)
  buf.writeFloatLE(speed, 256);

  // f32 TireTempFrontLeft (offset 268)
  buf.writeFloatLE(tireTemp, 268);
  // f32 TireTempFrontRight (offset 272)
  buf.writeFloatLE(tireTemp + 0.5, 272);
  // f32 TireTempRearLeft (offset 276)
  buf.writeFloatLE(tireTemp - 0.5, 276);
  // f32 TireTempRearRight (offset 280)
  buf.writeFloatLE(tireTemp, 280);

  // f32 DistanceTraveled (offset 292)
  buf.writeFloatLE(distance, 292);
  // f32 CurrentRaceTime (offset 308)
  buf.writeFloatLE(time, 308);

  // u16 LapNumber (offset 312)
  buf.writeUInt16LE(1, 312);
  // u8 RacePosition (offset 314)
  buf.writeUInt8(3, 314);
  // u8 Accel (offset 315)
  buf.writeUInt8(accel, 315);
  // u8 Brake (offset 316)
  buf.writeUInt8(brake, 316);
  // u8 Clutch (offset 317)
  buf.writeUInt8(0, 317);
  // u8 HandBrake (offset 318)
  buf.writeUInt8(0, 318);
  // u8 Gear (offset 319)
  buf.writeUInt8(gear, 319);
  // s8 Steer (offset 320)
  buf.writeInt8(0, 320);

  // Send packet
  client.send(buf, 0, buf.length, PORT, HOST, (err) => {
    if (err) {
      console.error('Error sending telemetry packet:', err);
    }
  });
}, INTERVAL);
