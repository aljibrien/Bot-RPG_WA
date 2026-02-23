import { getUser, saveUser, isPremium, useLimit } from "../utils.js";
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

  // 🔥 Kalau masih mancing
  if (user.fishingend > now) {
    return sock.sendMessage(from, {
      text: `@${sender.split("@")[0]} kamu masih mancing.\nSisa ${format(user.fishingend - now)}`,
      mentions: [sender],
    });
  }

  // 🔥 Kalau selesai & claim
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
      rarity = "Ikan ukuran kecil";
    } else if (chance < 0.9) {
      user.sedang += amount;
      rarity = "Ikan ukuran sedang";
    } else if (chance < 0.99) {
      user.besar += amount;
      rarity = "Ikan ukuran besar";
    } else {
      user.legend += amount;
      rarity = "Ikan LEGEND ✨";
    }

    user.fishingend = 0;
    user.lastfishing = now;

    await saveUser(sender, user);

    return sock.sendMessage(from, {
      text: `${rarity} didapat!\n+${amount} ekor`,
    });
  }

  // 🔥 Cooldown sebelum mulai
  const cooldown = config.cooldown.fishing - (now - user.lastfishing);
  if (cooldown > 0)
    return sock.sendMessage(from, {
      text: `@${sender.split("@")[0]} mancing masih cooldown.\nTunggu ${format(cooldown)}`,
      mentions: [sender],
    });

  // 🔥 Mulai mancing
  user.fishingend = now + Math.floor(Math.random() * 3 + 1) * 60000;

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(from, {
    text: `@${sender.split("@")[0]} mulai mancing!
Durasi ${format(user.fishingend - now)}
Ketik .fish lagi setelah selesai.`,
    mentions: [sender],
  });
};
