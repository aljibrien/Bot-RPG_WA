import {
  getUser,
  saveUser,
  useLimit,
  getActiveWorkers,
  getActiveJobsText,
} from "../utils.js";
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

  // ================= LAGI REST =================
  if (user.restend && user.restend > now) {
    return sock.sendMessage(from, {
      text: "Kamu sedang istirahat di hospital. Tidak bisa mancing.",
    });
  }

  // ================= HP CHECK =================
  if (user.hp <= 0) {
    return sock.sendMessage(from, {
      text: "HP kamu 0. Istirahat dulu di hospital.",
    });
  }

  // ================= MASIH MANCING =================
  if (user.fishingend && user.fishingend > now) {
    return sock.sendMessage(from, {
      text: `Masih mancing.\nSisa ${format(user.fishingend - now)}`,
    });
  }

  // ================= WORKERS CHECK =================
  if (activeWorkers >= user.workers) {
    return sock.sendMessage(from, {
      text: getActiveJobsText(user),
    });
  }

  // ================= START FISH =================
  const duration = (Math.floor(Math.random() * 3) + 1) * 60000;
  user.fishingend = now + duration;

  useLimit(user);
  await saveUser(sender, user);

  let text = "";

  if (auto) {
    text += auto + "\n\n";
  }

  text += `🎣 Mulai mancing!
Durasi ${format(duration)}
Ketik .claim untuk ambil hasil.`;

  return sock.sendMessage(from, { text }, { quoted: msg });
};
