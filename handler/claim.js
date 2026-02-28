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
    let chance = Math.random();

    if (premium) {
      chance -= config.premiumBoost.fishingLuck;
      if (chance < 0) chance = 0;
    }

    let rarity;

    if (!premium) {
      if (chance < 0.5) {
        rarity = "Ikan kecil";
        user.kecil++;
      } else if (chance < 0.8) {
        rarity = "Ikan sedang";
        user.sedang++;
      } else if (chance < 0.97) {
        rarity = "Ikan besar";
        user.besar++;
      } else {
        rarity = "Ikan LEGEND ✨";
        user.legend++;
      }
    } else {
      if (chance < 0.4) {
        rarity = "Ikan kecil";
        user.kecil++;
      } else if (chance < 0.75) {
        rarity = "Ikan sedang";
        user.sedang++;
      } else if (chance < 0.95) {
        rarity = "Ikan besar";
        user.besar++;
      } else {
        rarity = "Ikan LEGEND ✨";
        user.legend++;
      }
    }

    user.fishingend = 0;
    user.lastfishing = now;

    message += isAuto
      ? `🎣 Hasil mancing sebelumnya!
${rarity}
+1 ekor\n\n`
      : `🎣 ${rarity}
+1 ekor\n\n`;
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
      user.gold += user.pendinggold;

      message += isAuto
        ? `🕵️ Hasil rob sebelumnya!
+${user.pendinggold} gold\n\n`
        : `🕵️ Misi beres!
+${user.pendinggold} gold\n\n`;

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
      user.gold += user.pendinggold;

      message += isAuto
        ? `💻 Hasil hack sebelumnya!
+${user.pendinggold} gold\n\n`
        : `💻 Sistem jebol!
+${user.pendinggold} gold\n\n`;

      user.pendinggold = 0;
    } else {
      const minFine = 100;
      const percent = Math.random() * 0.1 + 0.05; // 5% - 15%
      const calculated = Math.floor(user.gold * percent);

      const lost = Math.max(minFine, calculated);

      user.gold = Math.max(user.gold - lost, 0);

      message += isAuto
        ? `💻 Hack sebelumnya gagal!
-Gold ${lost}\n\n`
        : `💻 Akses ditolak!
-Gold ${lost}\n\n`;
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

  const result = await processClaim(user, false);

  if (!result) return sock.sendMessage(from, { text: "Belum ada hasil." });

  await saveUser(sender, user);

  return sock.sendMessage(from, { text: result }, { quoted: msg });
};
