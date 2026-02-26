import supabase from "./supabase.js";

// CHECK REGISTER
async function isRegistered(id) {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .single();

  return !!data;
}

// REGISTER USER
async function registerUser(id, name) {
  const { error } = await supabase.from("users").insert({
    id,
    name: name,
    level: 1,
    exp: 0,
    gold: 100,
    bank: 0,

    kecil: 0,
    sedang: 0,
    besar: 0,
    legend: 0,

    hp: 100,
    workers: 1,
    restend: 0,

    lastrob: 0,
    robend: 0,
    lastfishing: 0,
    lastdungeon: 0,
    dungeonend: 0,

    premium: false,
    premiumexpire: 0,

    limit: 20,
    lastreset: 0,
    lastcommand: 0,
    spamcount: 0,

    shielduntil: 0,
    fishingboostuntil: 0,
    fishingend: 0,
  });

  if (error) console.error(error);
}

// GET USER
async function getUser(id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// SAVE USER
async function saveUser(id, user) {
  const { error } = await supabase.from("users").update(user).eq("id", id);

  if (error) console.error(error);
}

// PREMIUM CHECK
function isPremium(user) {
  if (!user.premium) return false;

  if (Date.now() > user.premiumexpire) {
    user.premium = false;
    return false;
  }

  return true;
}

// LEVEL SYSTEM
function checkLevelUp(user) {
  let leveledUp = false;
  let requiredExp = user.level * 100;

  while (user.exp >= requiredExp) {
    user.exp -= requiredExp;
    user.level++;
    leveledUp = true;
    requiredExp = user.level * 100;
  }

  return leveledUp;
}

// LIMIT SYSTEM
function useLimit(user) {
  if (!isPremium(user)) {
    user.limit--;
  }
}

function getMaxHP(user) {
  const base = 100;
  const perLevel = 20;
  return base + (user.level - 1) * perLevel;
}

function getActiveWorkers(user) {
  const now = Date.now();
  let active = 0;

  if (user.fishingend && user.fishingend > now) active++;
  if (user.dungeonend && user.dungeonend > now) active++;
  if (user.robend && user.robend > now) active++;

  return active;
}

export {
  isRegistered,
  registerUser,
  getUser,
  saveUser,
  isPremium,
  checkLevelUp,
  useLimit,
  getMaxHP,
  getActiveWorkers,
};
