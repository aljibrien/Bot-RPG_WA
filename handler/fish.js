import { getUser, saveDB, isPremium } from "../utils.js";
import config from "../config.js";

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default async (sock, from, sender) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const premium = isPremium(user);
  const now = Date.now();

  // =========================
  // Kalau masih mancing
  // =========================
  if (user.fishingEnd > now) {
    const remaining = user.fishingEnd - now;
    return sock.sendMessage(from, {
      text: `@${sender.split("@")[0]} kamu masih mancing.
Sisa waktu ${formatTime(remaining)}`,
      mentions: [sender],
    });
  }

  // =========================
  // Kalau selesai & claim hasil
  // =========================
  if (user.fishingEnd !== 0 && user.fishingEnd <= now) {
    let chance = Math.random();

    // Boost luck premium
    if (premium) {
      chance -= config.premiumBoost.fishingLuck;
      if (chance < 0) chance = 0;
    }

    const amount = premium ? config.premiumBoost.fishAmount : 1;

    let rarity = "";

    if (chance < 0.6) {
      user.fish.kecil += amount;
      rarity = "Ikan kecil";
    } else if (chance < 0.9) {
      user.fish.sedang += amount;
      rarity = "Ikan sedang";
    } else if (chance < 0.99) {
      user.fish.besar += amount;
      rarity = "Ikan besar";
    } else {
      user.fish.legend += amount;
      rarity = "Ikan LEGEND";
    }

    user.fishingEnd = 0;
    user.lastFishing = now;
    saveDB();

    return sock.sendMessage(from, {
      text: `${rarity} didapat!\n+${amount} ekor`,
    });
  }

  // =========================
  // Cooldown biasa
  // =========================
  const remainingCooldown = config.cooldown.fishing - (now - user.lastFishing);

  if (remainingCooldown > 0) {
    return sock.sendMessage(from, {
      text: `@${sender.split("@")[0]} mancing masih cooldown.
Tunggu ${formatTime(remainingCooldown)}`,
      mentions: [sender],
    });
  }

  // =========================
  // Mulai mancing baru
  // =========================
  const duration = Math.floor(Math.random() * 3 + 1) * 60000;

  user.fishingEnd = now + duration;
  saveDB();

  return sock.sendMessage(from, {
    text: `@${sender.split("@")[0]} mulai mancing!
Durasi: ${formatTime(duration)}
Ketik .fish lagi setelah selesai untuk melihat hasil.`,
    mentions: [sender],
  });
};
