import { getUser, saveDB, isPremium, checkLevelUp } from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const premium = isPremium(user);
  const now = Date.now();

  if (user.dungeonEnd > now) {
    const remaining = user.dungeonEnd - now;
    return sock.sendMessage(from, {
      text: `Kamu masih di dungeon.\nSisa waktu ${formatTime(remaining)}`,
    });
  }

  if (user.dungeonEnd !== 0 && user.dungeonEnd <= now) {
    const event = Math.random();
    let message = "";

    if (event < 0.6) {
      const damage = Math.floor(Math.random() * 40) + 10;
      const reward = Math.floor(Math.random() * 150) + 50;
      const win = Math.random() < 0.7;

      if (win) {
        const goldReward = premium
          ? Math.floor(reward * config.premiumBoost.gold)
          : reward;

        const expReward = premium
          ? Math.floor(20 * config.premiumBoost.exp)
          : 20;

        user.gold += goldReward;

        const oldLevel = user.level;
        user.exp += expReward;
        checkLevelUp(user);

        message = `Menang lawan monster!
+${goldReward} gold
+${expReward} exp`;

        if (user.level > oldLevel) {
          message += `\nLEVEL UP! Sekarang level ${user.level}`;
        }
      } else {
        user.hp = Math.max(user.hp - damage, 0);
        message = `Kalah lawan monster.
-HP ${damage}`;
      }
    } else if (event < 0.9) {
      const damage = Math.floor(Math.random() * 30) + 5;
      user.hp = Math.max(user.hp - damage, 0);
      message = `Kena trap mematikan!\n-HP ${damage}`;
    } else {
      const reward = Math.floor(Math.random() * 300) + 200;
      const goldReward = premium
        ? Math.floor(reward * config.premiumBoost.gold)
        : reward;

      user.gold += goldReward;
      message = `LUCKY!\n+${goldReward} gold`;
    }

    user.dungeonEnd = 0;
    user.lastDungeon = now;
    saveDB();
    return sock.sendMessage(from, { text: message });
  }

  const remainingCooldown = config.cooldown.dungeon - (now - user.lastDungeon);

  if (remainingCooldown > 0)
    return sock.sendMessage(from, {
      text: `Dungeon cooldown.\nTunggu ${formatTime(remainingCooldown)}`,
    });

  const duration = Math.floor(Math.random() * 4 + 1) * 60000;
  user.dungeonEnd = now + duration;
  saveDB();

  return sock.sendMessage(from, {
    text: `@${sender.split("@")[0]} masuk ke dungeon!
Durasi: ${formatTime(duration)}
Ketik .dungeon lagi setelah selesai.`,
    mentions: [sender],
  });
};
