import fs from "fs";

const DB_FILE = "./database.json";

let db = {};

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    db = raw ? JSON.parse(raw) : {};
  } catch {
    db = {};
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function isRegistered(id) {
  return !!db[id];
}

function registerUser(id) {
  db[id] = {
    level: 1,
    exp: 0,
    gold: 100,
    bank: 0,
    fish: {
      kecil: 0,
      sedang: 0,
      besar: 0,
      legend: 0,
    },
    hp: 100,

    lastRob: 0,
    lastFishing: 0,
    lastDungeon: 0,

    dungeonEnd: 0,

    premium: false,
    premiumExpire: 0,

    limit: 30,
    lastReset: 0,
    lastCommand: 0,
    spamCount: 0,

    shieldUntil: 0,
    fishingBoostUntil: 0,
  };

  saveDB();
}

function getUser(id) {
  const user = db[id];
  if (!user) return null;

  // 🔥 Normalisasi fish jika database lama rusak
  if (!user.fish || typeof user.fish !== "object") {
    user.fish = {
      kecil: 0,
      sedang: 0,
      besar: 0,
      legend: 0,
    };
  }

  // 🔥 Pastikan field baru selalu ada
  if (!user.dungeonEnd) user.dungeonEnd = 0;
  if (!user.shieldUntil) user.shieldUntil = 0;
  if (!user.fishingBoostUntil) user.fishingBoostUntil = 0;

  return user;
}

function isPremium(user) {
  if (!user.premium) return false;

  if (Date.now() > user.premiumExpire) {
    user.premium = false;
    return false;
  }

  return true;
}

function checkLevelUp(user) {
  let requiredExp = user.level * 100;

  while (user.exp >= requiredExp) {
    user.exp -= requiredExp;
    user.level++;
    requiredExp = user.level * 100;
  }
}

export {
  db,
  saveDB,
  isRegistered,
  registerUser,
  getUser,
  isPremium,
  checkLevelUp,
};
