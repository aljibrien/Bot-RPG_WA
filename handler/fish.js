import { getUser, saveUser, useLimit, getActiveWorkers } from "../utils.js";

function format(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "Daftar dulu bro, jangan nyelonong.",
    });
  }

  const now = Date.now();
  const activeWorkers = getActiveWorkers(user);

  // ================= REST CHECK =================
  if (user.restend && user.restend > now) {
    return sock.sendMessage(from, {
      text: "Kamu sedang istirahat di hospital. Tidak bisa mancing.",
    });
  }

  // ================= HP 0 CHECK =================
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
      text: "Semua worker sedang bekerja.",
    });
  }

  // ================= START FISHING =================
  user.fishingend = now + Math.floor(Math.random() * 3 + 1) * 60000;

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(
    from,
    {
      text: `🎣 Mulai mancing!\nDurasi ${format(
        user.fishingend - now,
      )}\nKetik .claim untuk ambil hasil.`,
    },
    { quoted: msg },
  );
};
