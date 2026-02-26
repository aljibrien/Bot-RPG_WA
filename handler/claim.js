import {
  getUser,
  saveUser,
  isPremium,
  checkLevelUp,
  getMaxHP,
} from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, { text: "Ketik .daftar dulu." });
  }

  const now = Date.now();
  const premium = isPremium(user);

  let message = "";

  // ================= REST SELESAI =================
  if (user.restend && user.restend <= now) {
    user.hp = getMaxHP(user);
    user.restend = 0;
    message += `🛏️ Istirahat selesai.\nHP kembali penuh.\n\n`;
  }

  // Kalau masih rest
  if (user.restend && user.restend > now) {
    return sock.sendMessage(
      from,
      { text: "Kamu sedang istirahat di hospital." },
      { quoted: msg },
    );
  }

  // ================= 🎣 FISH CLAIM =================
  if (user.fishingend && user.fishingend <= now) {
    let chance = Math.random();

    if (premium) {
      chance -= config.premiumBoost.fishingLuck;
      if (chance < 0) chance = 0;
    }

    const amount = premium ? config.premiumBoost.fishAmount : 1;

    let rarity = "";

    if (chance < 0.6) {
      user.kecil += amount;
      rarity = "Ikan kecil";
    } else if (chance < 0.9) {
      user.sedang += amount;
      rarity = "Ikan sedang";
    } else if (chance < 0.99) {
      user.besar += amount;
      rarity = "Ikan besar";
    } else {
      user.legend += amount;
      rarity = "Ikan LEGEND ✨";
    }

    user.fishingend = 0;
    user.lastfishing = now;

    message += `🎣 ${rarity}\n+${amount} ekor\n\n`;
  }

  // ================= 🏰 DUNGEON CLAIM =================
  if (user.dungeonend && user.dungeonend <= now) {
    const event = Math.random();

    if (event < 0.6) {
      const baseGold = Math.floor(Math.random() * 150) + 50;
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
      const baseGold = Math.floor(Math.random() * 300) + 200;
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

  // ================= 🕵️ ROB CLAIM =================
  if (user.robend && user.robend <= now) {
    if (user.pendinggold && user.pendinggold > 0) {
      user.gold += user.pendinggold;
      message += `🕵️ Rob berhasil!\n+${user.pendinggold} gold\n\n`;
      user.pendinggold = 0;
    } else {
      message += `🕵️ Rob gagal! HP sudah berkurang.\n\n`;
    }

    user.robend = 0;
  }

  // ================= TIDAK ADA YANG BISA DI CLAIM =================
  if (!message) {
    return sock.sendMessage(from, {
      text: "Belum ada yang bisa di-claim.",
    });
  }

  await saveUser(sender, user);

  return sock.sendMessage(from, { text: message.trim() }, { quoted: msg });
};
