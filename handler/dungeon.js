import { getUser, saveUser, useLimit, getActiveWorkers } from "../utils.js";
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
  if (auto) {
    await saveUser(sender, user);
  }

  const activeWorkers = getActiveWorkers(user);

  // ================= REST CHECK =================
  if (user.restend && user.restend > now) {
    return sock.sendMessage(from, {
      text: "Kamu sedang istirahat di hospital. Tidak bisa masuk dungeon.",
    });
  }

  // ================= HP CHECK =================
  if (user.hp <= 0) {
    return sock.sendMessage(from, {
      text: "HP kamu 0. Istirahat dulu di hospital.",
    });
  }

  if (user.hp < 30) {
    return sock.sendMessage(from, {
      text: "HP minimal 30 untuk masuk dungeon.",
    });
  }

  // ================= MASIH DI DUNGEON =================
  if (user.dungeonend && user.dungeonend > now) {
    return sock.sendMessage(from, {
      text: `Masih di dungeon.\nSisa ${format(user.dungeonend - now)}`,
    });
  }

  // ================= WORKERS CHECK =================
  if (activeWorkers >= user.workers) {
    return sock.sendMessage(from, {
      text: "Semua worker sedang bekerja.",
    });
  }

  // ================= START DUNGEON =================
  const duration = (Math.floor(Math.random() * 6) + 5) * 60000;
  user.dungeonend = now + duration;

  useLimit(user);
  await saveUser(sender, user);

  let finalText = "";

  if (auto) {
    finalText += auto + "\n\n";
  }

  finalText += `🏰 Masuk ke dungeon!
Durasi ${format(duration)}
Ketik .claim untuk ambil hasil.`;

  return sock.sendMessage(from, { text: finalText }, { quoted: msg });
};
