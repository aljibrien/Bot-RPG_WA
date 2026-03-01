import {
  getUser,
  saveUser,
  isPremium,
  checkLevelUp,
  getMaxHP,
} from "../utils.js";
import config from "../config.js";

export async function processClaim(user, isAuto = false) {
  const now = Date.now();
  const premium = isPremium(user);
  let message = "";

  // ===== REST =====
  if (user.restend && user.restend <= now) {
    user.hp = getMaxHP(user);
    user.restend = 0;

    message += `🛏️ Istirahat selesai.
HP kembali penuh.\n\n`;
  }

  // ===== FISH =====
  if (user.fishingend && user.fishingend <= now) {
    let amount = 1;
    const rollAmount = Math.random();

    // ================= BONUS JUMLAH =================

    switch (user.rod) {
      case "vortex":
        if (rollAmount < 0.25) amount = 2;
        break;

      case "inferno":
        if (rollAmount < 0.35) amount = 2;
        break;

      case "abbysal":
        if (rollAmount < 0.5) amount = 2;
        break;

      case "demon":
        if (rollAmount < 0.15) amount = 3;
        else if (rollAmount < 0.65) amount = 2;
        break;

      case "angel":
        if (rollAmount < 0.2) amount = 3;
        else if (rollAmount < 0.8) amount = 2;
        break;

      case "god":
        if (rollAmount < 0.05) amount = 4;
        else if (rollAmount < 0.35) amount = 3;
        else if (rollAmount < 0.95) amount = 2;
        break;
    }

    let totalExp = 0;

    let resultText = isAuto
      ? `🎣 Hasil mancing sebelumnya!\n`
      : `🎣 Hasil mancing!\n`;

    // ================= ROLL PER IKAN =================
    for (let i = 0; i < amount; i++) {
      let chance = Math.random();

      // ROD RARITY BOOST
      if (user.rod === "kayu") chance -= 0.03;
      if (user.rod === "phantom") chance -= 0.06;
      if (user.rod === "tempest") chance -= 0.1;
      if (user.rod === "vortex") chance -= 0.15;
      if (user.rod === "inferno") chance -= 0.2;
      if (user.rod === "abbysal") chance -= 0.25;
      if (user.rod === "demon") chance -= 0.3;
      if (user.rod === "angel") chance -= 0.3;
      if (user.rod === "god") chance -= 0.35;

      if (premium) {
        chance -= config.premiumBoost.fishingLuck;
      }

      if (chance < 0) chance = 0;

      let rarity;

      if (!premium) {
        if (chance < 0.5) rarity = "kecil";
        else if (chance < 0.8) rarity = "sedang";
        else if (chance < 0.97) rarity = "besar";
        else rarity = "legend";
      } else {
        if (chance < 0.4) rarity = "kecil";
        else if (chance < 0.75) rarity = "sedang";
        else if (chance < 0.95) rarity = "besar";
        else rarity = "legend";
      }

      user[rarity] += 1;

      const expMap = {
        kecil: 3,
        sedang: 5,
        besar: 8,
        legend: 12,
      };

      totalExp += expMap[rarity] || 0;

      resultText += `+1 ${rarity}\n`;
    }

    const finalExp = premium
      ? Math.floor(totalExp * config.premiumBoost.exp)
      : totalExp;

    user.exp += finalExp;

    const leveledUp = checkLevelUp(user);

    user.fishingend = 0;
    user.lastfishing = now;

    message += `${resultText}+${finalExp} exp\n\n`;

    if (leveledUp) {
      user.hp = getMaxHP(user);
      message += `🔥 LEVEL UP! Sekarang level ${user.level}\n\n`;
    }
  }

  // ===== DUNGEON =====
  if (user.dungeonend && user.dungeonend <= now) {
    const event = Math.random();

    if (event < 0.6) {
      const baseGold = Math.floor(Math.random() * 201) + 100;
      const baseExp = 30;

      const gold = premium
        ? Math.floor(baseGold * config.premiumBoost.gold)
        : baseGold;

      const expGain = premium
        ? Math.floor(baseExp * config.premiumBoost.exp)
        : baseExp;

      user.gold += gold;
      user.exp += expGain;

      const leveledUp = checkLevelUp(user);

      message += isAuto
        ? `🏰 Menang lawan monster sebelumnya!
+${gold} gold
+${expGain} exp`
        : `🏰 Menang lawan monster!
+${gold} gold
+${expGain} exp`;

      if (leveledUp) {
        user.hp = getMaxHP(user);
        message += `\n🔥 LEVEL UP! Sekarang level ${user.level}`;
      }
    } else if (event < 0.9) {
      const damage = Math.floor(Math.random() * 30) + 10;
      user.hp = Math.max(user.hp - damage, 0);

      message += isAuto
        ? `🏰 Trap sebelumnya!
-HP ${damage}`
        : `🏰 Kena trap!
-HP ${damage}`;
    } else {
      const baseGold = Math.floor(Math.random() * 201) + 500;
      const gold = premium
        ? Math.floor(baseGold * config.premiumBoost.gold)
        : baseGold;

      user.gold += gold;

      message += isAuto
        ? `🏰 Lucky room sebelumnya!
+${gold} gold`
        : `🏰 LUCKY ROOM!
+${gold} gold`;
    }

    user.dungeonend = 0;
    user.lastdungeon = now;
    message += `\n\n`;
  }

  // ===== ROB =====
  if (user.robend && user.robend <= now) {
    if (user.pendinggold && user.pendinggold > 0) {
      let expGain = 10;
      if (premium) expGain = Math.floor(expGain * config.premiumBoost.exp);

      user.gold += user.pendinggold;
      user.exp += expGain;
      const leveledUp = checkLevelUp(user);

      message += isAuto
        ? `🕵️ Hasil rob sebelumnya!
+${user.pendinggold} gold
+${expGain} exp\n\n`
        : `🕵️ Misi beres!
+${user.pendinggold} gold
+${expGain} exp\n\n`;

      if (leveledUp) {
        user.hp = getMaxHP(user);
        message += `🔥 LEVEL UP! Sekarang level ${user.level}\n\n`;
      }
      user.pendinggold = 0;
    } else {
      const damage = Math.floor(Math.random() * 21) + 20; // 20 - 40
      user.hp = Math.max(user.hp - damage, 0);

      message += isAuto
        ? `🕵️ Rob sebelumnya gagal!
Kena gebukin warga 😭
-HP ${damage}\n\n`
        : `🕵️ Ketahuan!
Kena gebukin warga 😭
-HP ${damage}\n\n`;
    }

    user.robend = 0;
  }

  // ===== HACK =====
  if (user.hackend && user.hackend <= now) {
    if (user.pendinggold && user.pendinggold > 0) {
      let expGain = 15;
      if (premium) expGain = Math.floor(expGain * config.premiumBoost.exp);

      user.gold += user.pendinggold;
      user.exp += expGain;

      const leveledUp = checkLevelUp(user);
      message += isAuto
        ? `💻 Hasil hack sebelumnya!
+${user.pendinggold} gold
+${expGain} exp\n\n`
        : `💻 Sistem jebol!
+${user.pendinggold} gold
+${expGain} exp\n\n`;

      if (leveledUp) {
        user.hp = getMaxHP(user);
        message += `🔥 LEVEL UP! Sekarang level ${user.level}\n\n`;
      }
      user.pendinggold = 0;
    } else {
      const minFine = 150;
      const percent = Math.random() * 0.1 + 0.05; // 5% - 15%
      const calculated = Math.floor(user.gold * percent);

      const lost = Math.max(minFine, calculated);

      user.gold = Math.max(user.gold - lost, 0);

      message += isAuto
        ? `💻 Hack sebelumnya gagal!
-${lost} gold\n\n`
        : `💻 Akses gagal!
-${lost} gold\n\n`;
    }

    user.hackend = 0;
  }

  return message.trim();
}

// ======================
// COMMAND .CLAIM
// ======================
export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });
  }

  const result = await processClaim(user, false);

  if (!result) {
    const now = Date.now();

    function format(ms) {
      const s = Math.ceil(ms / 1000);
      return `${Math.floor(s / 60)}m ${s % 60}s`;
    }

    let text = "⏳ Belum ada hasil.\n";

    if (user.fishingend && user.fishingend > now)
      text += `🎣 Mancing: ${format(user.fishingend - now)}\n`;

    if (user.dungeonend && user.dungeonend > now)
      text += `🏰 Dungeon: ${format(user.dungeonend - now)}\n`;

    if (user.robend && user.robend > now)
      text += `🕵️ Rob: ${format(user.robend - now)}\n`;

    if (user.hackend && user.hackend > now)
      text += `💻 Hack: ${format(user.hackend - now)}\n`;

    if (user.restend && user.restend > now)
      text += `🛏 Rest: ${format(user.restend - now)}\n`;

    return sock.sendMessage(from, { text }, { quoted: msg });
  }

  await saveUser(sender, user);

  return sock.sendMessage(from, { text: result }, { quoted: msg });
};
