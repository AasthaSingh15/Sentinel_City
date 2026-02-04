const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: "*"
}));
app.use(express.json());

async function getAIPrediction(wardName, signals, diseaseData) {
  const prompt = `
    Context: You are a public health AI for "Sentinel City".
    Current Data for ${wardName}:
    - Environmental Signals: ${JSON.stringify(signals)}
    - Clinical Disease Reports: ${JSON.stringify(diseaseData)}

    Task:
    1. Analyze if these numbers suggest a virus outbreak (e.g., Nipah, Dengue, Flu).
    2. Provide a 'prediction' (What is happening?).
    3. Provide 3 'prevention' steps (What should citizens do?).
    4. Assign a 'risk' level (High, Medium, Low).

    IMPORTANT: Response must be valid JSON ONLY.
    Format: { "prediction": "string", "prevention": ["step1", "step2", "step3"], "risk": "string" }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "");
    return JSON.parse(text);
  } catch (err) {
    console.error("AI Error:", err);
    return { 
      prediction: "Unable to analyze real-time data.", 
      prevention: ["Maintain general hygiene", "Contact local health authorities"], 
      risk: "Unknown" 
    };
  }
}

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data || '{"wards":[],"signals":{},"users":[],"diseaseData":{}}');
  } catch (err) {
    return { wards: [], signals: {}, users: [], diseaseData: {} };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function generateAlert(signals, diseaseData = {}) {
  const {
    clinicVisits = 0,
    pharmacySales = 0,
    pollution = 0,
    temperature = 0,
    mobility = 0,
  } = signals || {};

  // Disease-specific alert logic
  const diseases = Object.keys(diseaseData || {});
  const highRiskDiseases = [];
  
  diseases.forEach((disease) => {
    const data = diseaseData[disease];
    const totalVisits = (data.clinicVisits || 0);
    const totalSales = (data.pharmacySales || 0);
    
    // High risk if clinic visits > 50 OR pharmacy sales > 60 for a disease
    if (totalVisits > 50 || totalSales > 60) {
      highRiskDiseases.push({
        disease,
        visits: totalVisits,
        sales: totalSales,
        risk: totalVisits > 70 || totalSales > 80 ? 'high' : 'medium'
      });
    }
  });

  if (highRiskDiseases.length > 0) {
    const highestRisk = highRiskDiseases.sort((a, b) => {
      if (a.risk === 'high' && b.risk !== 'high') return -1;
      if (b.risk === 'high' && a.risk !== 'high') return 1;
      return (b.visits + b.sales) - (a.visits + a.sales);
    })[0];

    const confidence = highestRisk.risk === 'high' ? 88 : 65;
    return {
      level: highestRisk.risk,
      reason: `${highestRisk.disease} is spreading fast in this area. Please be careful.`,
      confidence,
      disease: highestRisk.disease,
    };
  }

  // Original signal-based alerts
  if (pollution > 80 && clinicVisits > 70 && temperature < 20) {
    return {
      level: 'high',
      reason: 'Respiratory spike due to PM2.5 + cold inversion',
      confidence: 85,
    };
  }

  if (pharmacySales > 80) {
    return {
      level: 'medium',
      reason: 'OTC surge indicates viral outbreak',
      confidence: 72,
    };
  }

  return {
    level: 'normal',
    reason: 'No significant anomalies detected',
    confidence: 20,
  };
}

// Helper to compute city-wide analytics for anomaly detection, spread prediction
// and vulnerability scoring. This is deliberately lightweight and meant to power
// dashboard summaries rather than detailed epidemiological models.
function computeCityAnalytics() {
  const db = readDb();
  const wards = db.wards || [];
  const signalsByWard = db.signals || {};

  if (!wards.length) {
    return {
      baseline: {
        respiratoryBaseline: 0,
      },
      wards: [],
    };
  }

  // For this prototype, approximate "respiratory complaints" as the sum of
  // clinic visits + pharmacy sales (city-wide). We then derive a per-ward
  // baseline by dividing the city total across wards.
  let cityTotalRespComplaints = 0;
  const wardMetrics = wards.map((ward) => {
    const entry = signalsByWard[ward.id] || {};
    const s = entry.signals || {};

    const clinicVisits = Number(s.clinicVisits || 0);
    const pharmacySales = Number(s.pharmacySales || 0);
    const pollution = Number(s.pollution || 0);
    const mobility = Number(s.mobility || 0);

    const respiratoryComplaints = clinicVisits + pharmacySales;
    cityTotalRespComplaints += respiratoryComplaints;

    return {
      ward,
      clinicVisits,
      pharmacySales,
      pollution,
      mobility,
      respiratoryComplaints,
    };
  });

  const respiratoryBaseline =
    wards.length > 0 ? cityTotalRespComplaints / wards.length : 0;

  const wardAnalytics = wardMetrics.map((wm) => {
    const { ward, respiratoryComplaints, pollution, mobility } = wm;

    let baselineDeltaPct = 0;
    if (respiratoryBaseline > 0) {
      baselineDeltaPct =
        ((respiratoryComplaints - respiratoryBaseline) / respiratoryBaseline) *
        100;
    }

    const situationOfConcern = baselineDeltaPct >= 5; // ≥5% increase

    // Spread risk: simple composite of mobility and respiratory complaints.
    const spreadRiskRaw = respiratoryComplaints * 0.6 + mobility * 0.4;

    // Vulnerability index: blend respiratory load and pollution as a proxy for
    // environmental + health vulnerability. Values are normalized into 0–100.
    const vulnerabilityRaw = respiratoryComplaints * 0.4 + pollution * 0.6;

    return {
      wardId: ward.id,
      wardName: ward.name,
      respiratoryComplaints,
      baselineDeltaPct,
      situationOfConcern,
      spreadRiskRaw,
      vulnerabilityRaw,
    };
  });

  // Normalize spread/vulnerability scores into 0–100 bands for UI purposes.
  const maxSpread =
    wardAnalytics.reduce(
      (max, w) => (w.spreadRiskRaw > max ? w.spreadRiskRaw : max),
      0
    ) || 1;
  const maxVulnerability =
    wardAnalytics.reduce(
      (max, w) => (w.vulnerabilityRaw > max ? w.vulnerabilityRaw : max),
      0
    ) || 1;

  const normalizedWards = wardAnalytics.map((w) => ({
    wardId: w.wardId,
    wardName: w.wardName,
    respiratoryComplaints: w.respiratoryComplaints,
    baselineDeltaPct: Number(w.baselineDeltaPct.toFixed(1)),
    situationOfConcern: w.situationOfConcern,
    spreadRiskScore: Math.round((w.spreadRiskRaw / maxSpread) * 100),
    vulnerabilityIndex: Math.round(
      (w.vulnerabilityRaw / maxVulnerability) * 100
    ),
  }));

  return {
    baseline: {
      respiratoryBaseline: Number(respiratoryBaseline.toFixed(1)),
    },
    wards: normalizedWards,
  };
}

// GET /wards → return all wards
app.get('/wards', (req, res) => {
  const db = readDb();
  res.json(db.wards || []);
});

// POST /wards → add ward with name, lat, lng
app.post('/wards', (req, res) => {
  const { name, lat, lng } = req.body;
  if (!name || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'name, lat and lng are required' });
  }

  const db = readDb();
  const newWard = {
    id: generateId(),
    name,
    lat: Number(lat),
    lng: Number(lng),
  };

  db.wards.push(newWard);
  writeDb(db);

  res.status(201).json(newWard);
});

// POST /signals/:wardId → admin enters signals
app.post('/signals/:wardId', (req, res) => {
  const { wardId } = req.params;
  const {
    clinicVisits = 0,
    pharmacySales = 0,
    pollution = 0,
    temperature = 0,
    mobility = 0,
  } = req.body || {};

  const db = readDb();
  const wardExists = db.wards.find((w) => w.id === wardId);
  if (!wardExists) {
    return res.status(404).json({ error: 'Ward not found' });
  }

  const signals = {
    clinicVisits: Number(clinicVisits),
    pharmacySales: Number(pharmacySales),
    pollution: Number(pollution),
    temperature: Number(temperature),
    mobility: Number(mobility),
    updatedAt: new Date().toISOString(),
  };

  // Get disease data for this ward
  const diseaseData = (db.diseaseData && db.diseaseData[wardId]) || {};
  const alert = generateAlert(signals, diseaseData);

  if (!db.signals) db.signals = {};
  db.signals[wardId] = { signals, alert, diseaseData };

  writeDb(db);

  res.status(201).json({ wardId, signals, alert, diseaseData });
});

// GET /signals/:wardId → return signals + generated alert
app.get('/signals/:wardId', (req, res) => {
  const { wardId } = req.params;
  const db = readDb();

  const wardExists = db.wards.find((w) => w.id === wardId);
  if (!wardExists) {
    return res.status(404).json({ error: 'Ward not found' });
  }

  const entry = db.signals && db.signals[wardId];
  const diseaseData = (db.diseaseData && db.diseaseData[wardId]) || {};
  
  if (!entry) {
    // If no signals yet, return empty signals with normal alert
    const emptySignals = {
      clinicVisits: 0,
      pharmacySales: 0,
      pollution: 0,
      temperature: 0,
      mobility: 0,
      updatedAt: null,
    };
    const alert = generateAlert(emptySignals, diseaseData);
    return res.json({ wardId, signals: emptySignals, alert, diseaseData });
  }

  // Regenerate alert with current disease data
  const alert = generateAlert(entry.signals, diseaseData);
  res.json({ wardId, signals: entry.signals, alert, diseaseData });
});

// POST /simulate-policy → input cases, return reduced cases, hospital load, cost saved
app.post('/simulate-policy', (req, res) => {
  const { cases, policy } = req.body || {};
  const numericCases = Number(cases);
  if (Number.isNaN(numericCases) || numericCases < 0) {
    return res.status(400).json({ error: 'cases must be a non-negative number' });
  }

  let reductionFactor = 0.15;
  if (policy === 'mobile_clinic') reductionFactor = 0.35;
  else if (policy === 'mask_advisory') reductionFactor = 0.25;
  else if (policy === 'traffic_restriction') reductionFactor = 0.2;

  const reducedCases = Math.round(numericCases * (1 - reductionFactor));
  const hospitalLoad = Math.min(100, Math.round(reducedCases * 0.2));
  const costSaved = Math.round((numericCases - reducedCases) * 500);

  res.json({
    policy: policy || 'baseline',
    originalCases: numericCases,
    reducedCases,
    hospitalLoad,
    costSaved,
    timestamp: new Date().toISOString(),
  });
});

// User/Role Management APIs
// POST /users → create or get user by role
app.post('/users', (req, res) => {
  const { role, name } = req.body;
  if (!role || !['citizen', 'pharmacist', 'hospital'].includes(role)) {
    return res.status(400).json({ error: 'Valid role (citizen/pharmacist/hospital) and name required' });
  }

  const db = readDb();
  if (!db.users) db.users = [];

  // Check if user already exists (simple: by role + name, or generate ID)
  let user = db.users.find(u => u.role === role && u.name === name);
  
  if (!user) {
    user = {
      id: generateId(),
      role,
      name: name || `${role}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    db.users.push(user);
    writeDb(db);
  } else {
    user.lastLogin = new Date().toISOString();
    writeDb(db);
  }

  res.json(user);
});

// GET /users/:userId → get user data
app.get('/users/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  const user = db.users && db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// GET /users/:userId/data → get user's submitted data
app.get('/users/:userId/data', (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  if (!db.userData) db.userData = {};
  const userData = db.userData[userId] || {
    location: null,
    pollution: null,
    temperature: null,
    diseases: [],
    updatedAt: null,
  };
  res.json(userData);
});

// POST /users/:userId/data → save user's data
app.post('/users/:userId/data', (req, res) => {
  const { userId } = req.params;
  const { location, pollution, temperature, diseases } = req.body;
  
  const db = readDb();
  const user = db.users && db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!db.userData) db.userData = {};
  db.userData[userId] = {
    location: location || null,
    pollution: pollution !== undefined ? Number(pollution) : null,
    temperature: temperature !== undefined ? Number(temperature) : null,
    diseases: Array.isArray(diseases) ? diseases : [],
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  res.json(db.userData[userId]);
});

// POST /disease-data/:wardId → add disease-specific data for a ward
app.post('/disease-data/:wardId', (req, res) => {
  const { wardId } = req.params;
  const { disease, clinicVisits, pharmacySales } = req.body;

  if (!disease || disease.trim() === '') {
    return res.status(400).json({ error: 'Disease name is required' });
  }

  const db = readDb();
  const wardExists = db.wards.find((w) => w.id === wardId);
  if (!wardExists) {
    return res.status(404).json({ error: 'Ward not found' });
  }

  if (!db.diseaseData) db.diseaseData = {};
  if (!db.diseaseData[wardId]) db.diseaseData[wardId] = {};

  const diseaseName = disease.trim().toLowerCase();
  db.diseaseData[wardId][diseaseName] = {
    clinicVisits: Number(clinicVisits) || 0,
    pharmacySales: Number(pharmacySales) || 0,
    updatedAt: new Date().toISOString(),
  };

  // Update alert for this ward
  const signals = (db.signals && db.signals[wardId] && db.signals[wardId].signals) || {
    clinicVisits: 0,
    pharmacySales: 0,
    pollution: 0,
    temperature: 0,
    mobility: 0,
  };
  const alert = generateAlert(signals, db.diseaseData[wardId]);

  if (!db.signals) db.signals = {};
  if (!db.signals[wardId]) db.signals[wardId] = { signals };
  db.signals[wardId].alert = alert;
  db.signals[wardId].diseaseData = db.diseaseData[wardId];

  writeDb(db);
  res.json({ wardId, disease: diseaseName, data: db.diseaseData[wardId][diseaseName], alert });
});

// GET /disease-data/:wardId → get all disease data for a ward
app.get('/disease-data/:wardId', (req, res) => {
  const { wardId } = req.params;
  const db = readDb();
  const diseaseData = (db.diseaseData && db.diseaseData[wardId]) || {};
  res.json({ wardId, diseases: diseaseData });
});

// GET /ai-alerts/:wardId → Gemini AI medical prediction for a ward
app.get('/ai-alerts/:wardId', async (req, res) => {
  const { wardId } = req.params;
  const db = readDb();

  const ward = (db.wards || []).find((w) => w.id === wardId);
  if (!ward) {
    return res.status(404).json({ error: 'Ward not found' });
  }

  const signalsEntry = (db.signals && db.signals[wardId]) || {};
  const signals = signalsEntry.signals || {
    clinicVisits: 0,
    pharmacySales: 0,
    pollution: 0,
    temperature: 0,
    mobility: 0,
  };
  const diseaseData = (db.diseaseData && db.diseaseData[wardId]) || {};

  try {
    const aiResult = await getAIPrediction(ward.name, signals, diseaseData);
    // aiResult should already be of the form:
    // { prediction: string, prevention: string[], risk: "High" | "Medium" | "Low" }
    return res.json(aiResult);
  } catch (err) {
    console.error('AI prediction route error:', err);
    return res.status(500).json({
      prediction: 'AI engine failed to evaluate this ward.',
      prevention: [
        'Maintain basic respiratory hygiene',
        'Follow local public health advisories',
        'Seek medical care if symptoms worsen',
      ],
      risk: 'Unknown',
    });
  }
});

// GET /all-alerts → get all wards with their alerts (for operational view)
app.get('/all-alerts', (req, res) => {
  const db = readDb();
  const wards = db.wards || [];
  const alerts = wards.map(ward => {
    const signals = (db.signals && db.signals[ward.id] && db.signals[ward.id].signals) || {};
    const diseaseData = (db.diseaseData && db.diseaseData[ward.id]) || {};
    const alert = generateAlert(signals, diseaseData);
    return {
      wardId: ward.id,
      wardName: ward.name,
      lat: ward.lat,
      lng: ward.lng,
      alert,
      diseaseData,
    };
  });
  res.json(alerts);
});

// GET /simulation-history → return seeded simulation runs
app.get('/simulation-history', (req, res) => {
  const db = readDb();
  res.json(db.simulationHistory || []);
});

// GET /analytics/overview → city-wide anomaly detection & risk scoring
app.get('/analytics/overview', (req, res) => {
  const analytics = computeCityAnalytics();
  res.json(analytics);
});

app.get('/', (req, res) => {
  res.json({ status: 'Sentinel City backend running' });
});

app.listen(PORT, () => {
  console.log(`Sentinel City backend listening on port ${PORT}`);
});

