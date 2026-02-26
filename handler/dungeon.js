import {
  getUser,
  saveUser,
  useLimit,
  getMaxHP,
  getActiveWorkers,
} from "../utils.js";
import config from "../config.js";

function format(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async (sock, from, sender, msg) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, { text: "Ketik .daftar dulu." });
  }

  const now = Date.now();
  const activeWorkers = getActiveWorkers(user);

  // ================= WORKERS CHECK =================
  if (activeWorkers >= user.workers) {
    return sock.sendMessage(from, {
      text: "Semua worker sedang bekerja.",
    });
  }

  // ================= REST CHECK =================
  if (user.restend && user.restend > now) {
    return sock.sendMessage(
      from,
      {
        text: "Kamu sedang istirahat di hospital. Tidak bisa masuk dungeon.",
      },
      { quoted: msg },
    );
  }

  // ================= HP 0 CHECK =================
  if (user.hp <= 0) {
    return sock.sendMessage(
      from,
      {
        text: "HP kamu 0. Istirahat dulu di hospital.",
      },
      { quoted: msg },
    );
  }

  const maxHP = getMaxHP(user);

  // ================= LOW HP CHECK =================
  if (user.hp < 30) {
    return sock.sendMessage(
      from,
      {
        text: "HP minimal 30 untuk masuk dungeon. Istirahat dulu atau beli heal di shop",
      },
      { quoted: msg },
    );
  }

  // ================= MASIH DI DUNGEON =================
  if (user.dungeonend && user.dungeonend > now) {
    return sock.sendMessage(
      from,
      {
        text: `Masih di dungeon.\nSisa ${format(user.dungeonend - now)}`,
      },
      { quoted: msg },
    );
  }

  // ================= COOLDOWN =================
  const cooldown = config.cooldown.dungeon - (now - user.lastdungeon);
  if (cooldown > 0) {
    return sock.sendMessage(
      from,
      {
        text: `Dungeon masih cooldown.\nTunggu ${format(cooldown)}`,
      },
      { quoted: msg },
    );
  }

  // ================= START DUNGEON =================
  user.dungeonend = now + Math.floor(Math.random() * 4 + 1) * 60000;

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(
    from,
    {
      text: `🏰 Masuk ke dungeon!\nDurasi ${format(
        user.dungeonend - now,
      )}\nKetik .claim untuk ambil hasil.`,
    },
    { quoted: msg },
  );
};
