import { getUser, saveUser, useLimit } from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg, args) => {
  const user = await getUser(sender);
  if (!user)
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });

  const now = Date.now();
  const durationBodyguard = 3 * 60 * 60 * 1000; // 3 jam
  const durationFirewall = (4 * 60 + 30) * 60 * 1000; // 4 jam 30 menit
  const item = args[1]?.toLowerCase();

  if (!item) {
    return sock.sendMessage(
      from,
      {
        text: `── .✦
🛒 SHOP LIST:

💰 Gold kamu: ${user.gold}
🏦 Bank: ${user.bank}

.shop limit - 150 gold (+5 limit)
.shop bodyguard - 250 gold (anti rob 3 jam)
.shop firewall - 450 gold (anti hack 4 jam)
.shop heal - 100 gold (+50 HP)
.shop dungeon - 50 gold (reset cooldown)
.shop worker - 10000 gold (+1 worker)`,
      },
      { quoted: msg },
    );
  }

  if (item === "limit") {
    if (user.gold < 150)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 150;
    user.limit += 5;
  } else if (item === "bodyguard") {
    if (user.gold < 250)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 250;
    user.shielduntil =
      user.shielduntil > now
        ? user.shielduntil + durationBodyguard
        : now + durationBodyguard;
  } else if (item === "heal") {
    if (user.gold < 100)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 100;
    user.hp += 50;
  } else if (item === "dungeon") {
    if (user.gold < 50)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 50;
    user.lastdungeon = 0;
  } else if (item === "worker") {
    if (user.workers >= config.worker.max)
      return sock.sendMessage(from, { text: "Worker sudah maksimal." });

    if (user.gold < config.worker.price)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= config.worker.price;
    user.workers += 1;
  } else if (item === "firewall") {
    if (user.gold < 450)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 450;
    user.firewalluntil =
      user.firewalluntil > now
        ? user.firewalluntil + durationFirewall
        : now + durationFirewall;
  } else {
    return sock.sendMessage(from, { text: "Item tidak ditemukan." });
  }

  useLimit(user);
  await saveUser(sender, user);
  return sock.sendMessage(from, { text: `Pembelian ${item} berhasil.` });
};
