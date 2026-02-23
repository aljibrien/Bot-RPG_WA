import supabase from "./supabase.js";

// ========================
// CHECK REGISTER
// ========================
async function isRegistered(id) {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .single();

  return !!data;
}

// ========================
// REGISTER USER
// ========================
async function registerUser(id) {
  const { error } = await supabase.from("users").insert({
    id,
    level: 1,
    exp: 0,
    gold: 100,
    bank: 0,

    kecil: 0,
    sedang: 0,
    besar: 0,
    legend: 0,

    hp: 100,

    lastrob: 0,
    lastfishing: 0,
    lastdungeon: 0,
    dungeonend: 0,

    premium: false,
    premiumexpire: 0,

    limit: 30,
    lastreset: 0,
    lastcommand: 0,
    spamcount: 0,

    shielduntil: 0,
    fishingboostuntil: 0,
    fishingend: 0,
  });

  if (error) console.error(error);
}

// ========================
// GET USER
// ========================
async function getUser(id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// ========================
// SAVE USER
// ========================
async function saveUser(id, user) {
  const { error } = await supabase.from("users").update(user).eq("id", id);

  if (error) console.error(error);
}

// ========================
// PREMIUM CHECK
// ========================
function isPremium(user) {
  if (!user.premium) return false;

  if (Date.now() > user.premiumexpire) {
    user.premium = false;
    return false;
  }

  return true;
}

// ========================
// LEVEL SYSTEM
// ========================
function checkLevelUp(user) {
  let requiredExp = user.level * 100;

  while (user.exp >= requiredExp) {
    user.exp -= requiredExp;
    user.level++;
    requiredExp = user.level * 100;
  }
}

// ========================
// LIMIT SYSTEM
// ========================
function useLimit(user) {
  if (!isPremium(user)) {
    user.limit--;
  }
}

export {
  isRegistered,
  registerUser,
  getUser,
  saveUser,
  isPremium,
  checkLevelUp,
  useLimit,
};
