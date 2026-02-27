import {
  getUser,
  saveUser,
  isPremium,
  checkLevelUp,
  getMaxHP,
} from "../utils.js";
import config from "../config.js";

// ======================
// CORE CLAIM LOGIC
// ======================
export async function processClaim(user) {
  const now = Date.now();
  const premium = isPremium(user);
  let message = "";

  // ===== REST =====
  if (user.restend && user.restend <= now) {
    user.hp = getMaxHP(user);
    user.restend = 0;
    message += `🛏️ Istirahat selesai.\nHP kembali penuh.\n\n`;
  }

  // ===== FISH =====
  if (user.fishingend && user.fishingend <= now) {
    let chance = Math.random();

    if (premium) {
      chance -= config.premiumBoost.fishingLuck;
      if (chance < 0) chance = 0;
    }

    let rarity = "";

    if (!premium) {
      if (chance < 0.5) {
        user.kecil++;
        rarity = "Ikan kecil";
      } else if (chance < 0.8) {
        user.sedang++;
        rarity = "Ikan sedang";
      } else if (chance < 0.97) {
        user.besar++;
        rarity = "Ikan besar";
      } else {
        user.legend++;
        rarity = "Ikan LEGEND ✨";
      }
    } else {
      if (chance < 0.4) {
        user.kecil++;
        rarity = "Ikan kecil";
      } else if (chance < 0.75) {
        user.sedang++;
        rarity = "Ikan sedang";
      } else if (chance < 0.95) {
        user.besar++;
        rarity = "Ikan besar";
      } else {
        user.legend++;
        rarity = "Ikan LEGEND ✨";
      }
    }

    user.fishingend = 0;
    user.lastfishing = now;

    message += `🎣 ${rarity}\n+1 ekor\n\n`;
  }

  // ===== DUNGEON =====
  if (user.dungeonend && user.dungeonend <= now) {
    const event = Math.random();

    if (event < 0.6) {
      const baseGold = Math.floor(Math.random() * 201) + 100;
      const baseExp = 20;

      const gold = premium
        ? Math.floor(baseGold * config.premiumBoost.gold)
        : baseGold;

      const expGain = premium
        ? Math.floor(baseExp * config.premiumBoost.exp)
        : baseExp;

      user.gold += gold;
      user.exp += expGain;

      const leveledUp = checkLevelUp(user);

      message += `🏰 Menang lawan monster!\n+${gold} gold\n+${expGain} exp`;

      if (leveledUp) {
        user.hp = getMaxHP(user);
        message += `\n🔥 LEVEL UP! Sekarang level ${user.level}`;
      }
    } else if (event < 0.9) {
      const damage = Math.floor(Math.random() * 30) + 10;
      user.hp = Math.max(user.hp - damage, 0);
      message += `🏰 Kena trap!\n-HP ${damage}`;
    } else {
      const baseGold = Math.floor(Math.random() * 201) + 500;
      const gold = premium
        ? Math.floor(baseGold * config.premiumBoost.gold)
        : baseGold;

      user.gold += gold;
      message += `🏰 LUCKY ROOM!\n+${gold} gold`;
    }

    user.dungeonend = 0;
    user.lastdungeon = now;
    message += `\n\n`;
  }

  // ===== ROB =====
  if (user.robend && user.robend <= now) {
    if (user.pendinggold && user.pendinggold > 0) {
      user.gold += user.pendinggold;
      message += `🕵️ Misi beres!\n+${user.pendinggold} gold\n\n`;
      user.pendinggold = 0;
    } else {
      message += `🕵️ Ketahuan!\nHP lu yang jadi korban 😭\n\n`;
    }

    user.robend = 0;
  }

  // ===== HACK =====
  if (user.hackend && user.hackend <= now) {
    if (user.pendinggold && user.pendinggold > 0) {
      user.gold += user.pendinggold;
      message += `💻 Sistem jebol!\n+${user.pendinggold} gold\n\n`;
      user.pendinggold = 0;
    } else {
      message += `💻 Akses ditolak!\nHP lu kena imbasnya\n\n`;
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
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const result = await processClaim(user);

  if (!result)
    return sock.sendMessage(from, {
      text: "Belum ada hasil.",
    });

  await saveUser(sender, user);
  return sock.sendMessage(from, { text: result }, { quoted: msg });
};
