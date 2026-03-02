import { getUser, saveUser, useLimit, isPremium } from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg, args) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });
  }

  const now = Date.now();
  const durationBodyguard = 6 * 60 * 60 * 1000; // 6 jam
  const durationFirewall = 8 * 60 * 60 * 1000; // 8 jam
  const item = args[1]?.toLowerCase();

  if (!item) {
    return sock.sendMessage(
      from,
      {
        text: `╔════ 🛒 SHOP ════╗

💰 Gold : ${user.gold}
🏦 Bank : ${user.bank}

📦 Item
⟢ .shop limit → 200 gold  (+5 limit)
⟢ .shop bodyguard → 250 gold  (anti rob 6 jam)
⟢ .shop firewall → 450 gold  (anti hack 8 jam)
⟢ .shop heal → 100 gold  (+50 HP)
⟢ .shop worker → 10k gold  (+1 worker)

🎣 Rod
⟢ .shop rod kayu → 500 gold   (Lv 1)
⟢ .shop rod phantom → 2k gold    (Lv 3)
⟢ .shop rod tempest → 7,5k gold  (Lv 5)
⟢ .shop rod vortex → 25k gold   (Lv 8)
⟢ .shop rod inferno → 75k gold   (Lv 12)
⟢ .shop rod abbysal → 150k gold  (Lv 16)

⟢ demon / angel / god → Coming Soon

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (user.underrobuntil && user.underrobuntil > now) {
    return sock.sendMessage(from, {
      text: "💀 Rumah lu lagi dibobol, ini malah belanja. Prioritas hidup lu aneh.",
    });
  }

  // Kalau mau beli, cek limit dulu
  if (!isPremium(user) && user.limit <= 0) {
    return sock.sendMessage(from, {
      text: "⚠️ Limit kamu habis. Tidak bisa beli item.",
    });
  }

  let successText = `Pembelian ${item} berhasil.`;
  if (item === "limit") {
    if (user.gold < 200)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 200;
    user.limit += 6;
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
  } else if (item === "rod") {
    const type = args[2]?.toLowerCase();

    const rodData = {
      kayu: { price: 500, level: 1 },
      phantom: { price: 2000, level: 3 },
      tempest: { price: 7500, level: 5 },
      vortex: { price: 25000, level: 8 },
      inferno: { price: 75000, level: 12 },
      abbysal: { price: 150000, level: 16 },
    };

    if (!rodData[type])
      return sock.sendMessage(from, {
        text: "Pilih rod: kayu / phantom / tempest / vortex / inferno / abbysal",
      });

    const { price, level } = rodData[type];

    if (user.rod && rodData[user.rod]?.level >= level)
      return sock.sendMessage(from, {
        text: "Kamu sudah punya rod setara atau lebih tinggi.",
      });

    if (user.level < level)
      return sock.sendMessage(from, {
        text: `Rod ${type} butuh level ${level}. Level kamu masih ${user.level}.`,
      });

    if (user.gold < price)
      return sock.sendMessage(from, {
        text: "Gold tidak cukup.",
      });

    user.gold -= price;
    user.rod = type;
    successText = `Berhasil membeli rod ${type}.`;
  } else {
    return sock.sendMessage(from, { text: "Item tidak ditemukan." });
  }

  useLimit(user);
  await saveUser(sender, user);
  return sock.sendMessage(from, { text: successText });
};
