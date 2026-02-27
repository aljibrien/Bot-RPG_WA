import { getUser, saveUser, getMaxHP, isPremium } from "../utils.js";

function format(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });
  }

  const now = Date.now();
  const maxHP = getMaxHP(user);
  const premium = isPremium(user);

  // ================= MASIH REST =================
  if (user.restend && user.restend > now) {
    return sock.sendMessage(from, {
      text: `Masih istirahat.\nSisa ${format(user.restend - now)}`,
    });
  }

  // ================= LAGI DUNGEON =================
  if (user.dungeonend && user.dungeonend > now) {
    return sock.sendMessage(from, {
      text: "Masih di dungeon. Selesaikan dulu sebelum ke hospital.",
    });
  }

  // ================= LAGI MANCING =================
  if (user.fishingend && user.fishingend > now) {
    return sock.sendMessage(from, {
      text: "Masih mancing. Selesaikan dulu sebelum ke hospital.",
    });
  }

  // ================= HP SUDAH FULL =================
  if (user.hp >= maxHP) {
    return sock.sendMessage(from, {
      text: "HP kamu sudah penuh. Gak perlu hospital.",
    });
  }

  // ================= DURASI REST =================
  const restDuration = premium
    ? 15 * 60 * 1000 // 15 menit premium
    : 30 * 60 * 1000; // 30 menit free

  user.restend = now + restDuration;
  await saveUser(sender, user);

  return sock.sendMessage(from, {
    text: `🛏️ Masuk hospital.
Durasi: ${premium ? "15 menit (Premium)" : "30 menit"}
Ketik .claim setelah selesai untuk full HP.`,
  });
};
