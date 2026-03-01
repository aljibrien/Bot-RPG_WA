import { getUser, saveUser, getMaxHP, isPremium } from "../utils.js";
import { processClaim } from "./claim.js";

function format(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });
  }

  const now = Date.now();

  // ================= AUTO CLAIM =================
  const auto = await processClaim(user, true);
  if (auto) await saveUser(sender, user);

  // ================= LAGI DUNGEON =================
  if (user.dungeonend && user.dungeonend > now)
    return sock.sendMessage(from, {
      text: "Masih di dungeon. Selesaikan dulu sebelum ke hospital.",
    });

  // ================= LAGI MANCING =================
  if (user.fishingend && user.fishingend > now)
    return sock.sendMessage(from, {
      text: "Masih mancing. Selesaikan dulu sebelum ke hospital.",
    });

  // ================= LAGI ROB =================
  if (user.robend && user.robend > now)
    return sock.sendMessage(from, {
      text: "Lagi operasi rob. Tunggu selesai dulu.",
    });

  // ================= LAGI HACK =================
  if (user.hackend && user.hackend > now)
    return sock.sendMessage(from, {
      text: "Lagi hack bank. Tunggu selesai dulu.",
    });

  // ================= MASIH REST =================
  if (user.restend && user.restend > now)
    return sock.sendMessage(from, {
      text: `Masih istirahat.\nSisa ${format(user.restend - now)}`,
    });

  // ================= HP SUDAH FULL =================
  if (user.hp >= getMaxHP(user))
    return sock.sendMessage(from, {
      text: "HP sudah penuh.",
    });

  // ================= START REST =================
  const duration = isPremium(user) ? 15 * 60 * 1000 : 30 * 60 * 1000;

  user.restend = now + duration;
  await saveUser(sender, user);

  let text = "";
  if (auto) text += auto + "\n\n";

  text += `🛏️ Masuk hospital.
Durasi ${format(duration)}
Ketik .claim setelah selesai.`;

  return sock.sendMessage(from, { text }, { quoted: msg });
};
