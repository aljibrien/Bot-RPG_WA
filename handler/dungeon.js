import {
  getUser,
  saveUser,
  isPremium,
  checkLevelUp,
  useLimit,
} from "../utils.js";
import config from "../config.js";

function format(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async (sock, from, sender) => {
  const user = await getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const now = Date.now();
  const premium = isPremium(user);

  if (user.dungeonend > now) {
    return sock.sendMessage(from, {
      text: `@${sender.split("@")[0]} masih di dungeon.\nSisa ${format(user.dungeonend - now)}`,
      mentions: [sender],
    });
  }

  if (user.dungeonend && user.dungeonend <= now) {
    const event = Math.random();
    let message = "";

    if (event < 0.6) {
      const reward = Math.floor(Math.random() * 150) + 50;
      const damage = Math.floor(Math.random() * 40) + 10;
      const win = Math.random() < 0.7;

      if (win) {
        const gold = premium
          ? Math.floor(reward * config.premiumBoost.gold)
          : reward;
        const expGain = premium ? Math.floor(20 * config.premiumBoost.exp) : 20;

        user.gold += gold;
        const oldLevel = user.level;
        user.exp += expGain;
        checkLevelUp(user);

        message = `Menang lawan monster!
+${gold} gold
+${expGain} exp`;

        if (user.level > oldLevel) message += `\nLEVEL UP! Level ${user.level}`;
      } else {
        user.hp = Math.max(user.hp - damage, 0);
        message = `Kalah lawan monster.\n-HP ${damage}`;
      }
    } else if (event < 0.9) {
      const damage = Math.floor(Math.random() * 30) + 5;
      user.hp = Math.max(user.hp - damage, 0);
      message = `Kena trap!\n-HP ${damage}`;
    } else {
      const reward = Math.floor(Math.random() * 300) + 200;
      const gold = premium
        ? Math.floor(reward * config.premiumBoost.gold)
        : reward;
      user.gold += gold;
      message = `LUCKY!\n+${gold} gold`;
    }

    user.dungeonend = 0;
    user.lastdungeon = now;

    await saveUser(sender, user);

    return sock.sendMessage(from, { text: message });
  }

  const cooldown = config.cooldown.dungeon - (now - user.lastdungeon);
  if (cooldown > 0)
    return sock.sendMessage(from, { text: `Cooldown ${format(cooldown)}` });

  user.dungeonend = now + Math.floor(Math.random() * 4 + 1) * 60000;
  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(from, {
    text: `@${sender.split("@")[0]} masuk ke dungeon!
Durasi ${format(user.dungeonend - now)}
ketik .dungeon lagi setelah selesai`,
    mentions: [sender],
  });
};
