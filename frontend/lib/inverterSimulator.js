/**
 * inverterSimulator.js — Solar Inverter Live Generation Engine
 * 
 * Provides mathematical models for residential solar power generation based on system capacity
 * and time-of-day. Simulates realistic solar curves, cumulative daily energy, and carbon offsets.
 */

// 1. Calculate live power output at a specific hour/minute of the day
export function getLivePower(capacityKw, timestamp = new Date()) {
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const timeDecimal = hour + minute / 60;

  // Solar generation window: 6:00 AM (6.0) to 6:00 PM (18.0)
  if (timeDecimal < 6.0 || timeDecimal > 18.0) {
    return 0; // Night time, zero output
  }

  // Sinusoidal curve peaking at 12:30 PM (12.5)
  // angle spans from 0 (at 6 AM) to PI (at 6 PM)
  const angle = (Math.PI * (timeDecimal - 6.0)) / 12;
  const standardOutput = Math.sin(angle) * capacityKw * 0.88; // 88% average panel efficiency peak
  
  // Add minor random fluctuation (+/- 2%) to look "live" and realistic
  const fluctuation = (Math.random() * 0.04 - 0.02) * capacityKw;
  
  return Math.max(0, parseFloat((standardOutput + fluctuation).toFixed(2)));
}

// 2. Calculate cumulative today's yield in kWh up to the current timestamp
export function getTodayYield(capacityKw, timestamp = new Date()) {
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const timeDecimal = hour + minute / 60;

  // A solar system in India yields roughly 4.2 times its kW capacity in kWh per day.
  const fullDayYield = capacityKw * 4.25;

  if (timeDecimal <= 6.0) return 0;
  if (timeDecimal >= 18.0) return parseFloat(fullDayYield.toFixed(2));

  // Integrate the sine curve from 6:00 AM (0) to timeDecimal (x)
  // Integral of sin((pi * x) / 12) dx is: - (12/pi) * cos((pi * x) / 12)
  // Evaluated from 0 to currentOffset (where currentOffset = timeDecimal - 6)
  const currentOffset = timeDecimal - 6.0;
  const ratio = (1 - Math.cos((Math.PI * currentOffset) / 12)) / 2; // normalizes to [0, 1] range

  return parseFloat((fullDayYield * ratio).toFixed(2));
}

// 3. Generate a 24-point array representing the generation curve for charting
export function getHourlyGenerationCurve(capacityKw) {
  const curve = [];
  for (let hour = 0; hour < 24; hour++) {
    let power = 0;
    if (hour >= 6 && hour <= 18) {
      // Mid-hour calculation (e.g. 12:30 for hour 12)
      const angle = (Math.PI * (hour + 0.5 - 6.0)) / 12;
      power = Math.sin(angle) * capacityKw * 0.88;
    }
    curve.push(parseFloat(Math.max(0, power).toFixed(2)));
  }
  return curve;
}

// 4. Calculate environmental impact
export function getEnvironmentalImpact(kwh) {
  // 1 kWh solar offsets roughly 0.85 kg of CO2
  // 1 tree absorbs roughly 20 kg of CO2 per year
  const co2Saved = kwh * 0.85;
  const equivalentTrees = co2Saved / 20;
  return {
    co2Kg: parseFloat(co2Saved.toFixed(1)),
    trees: parseFloat(equivalentTrees.toFixed(2))
  };
}

// 5. Get diagnostic telemetry (voltage, temperature, status)
export function getInverterTelemetry(capacityKw, timestamp = new Date()) {
  const livePower = getLivePower(capacityKw, timestamp);
  const hour = timestamp.getHours();
  
  let status = 'Online';
  let statusColor = 'text-emerald-400 bg-emerald-500/10';
  let temp = 28; // ambient baseline temperature (Celsius)
  
  if (livePower === 0) {
    status = (hour >= 19 || hour < 5) ? 'Idle / Sun Down' : 'Offline / Standby';
    statusColor = 'text-slate-400 bg-slate-500/10';
  } else {
    // Temperature rises proportionally to power output
    const ratio = livePower / capacityKw;
    temp = Math.round(28 + ratio * 24); // up to 52C peak
  }
  
  // Grid AC voltage (normally ~230V, fluctuating slightly)
  const gridVoltage = Math.round(228 + Math.random() * 6);
  
  return {
    status,
    statusColor,
    temp,
    gridVoltage,
    livePower
  };
}
