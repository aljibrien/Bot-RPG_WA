import { getUser, saveUser } from "../utils.js";

export default async (sock, from, sender, args) => {
  const user = await getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const item = args[1]?.toLowerCase();

  if (!item) {
    return sock.sendMessage(from, {
      text: `🛒 SHOP LIST:
.shop limit - 150 gold (+5 limit)
.shop shield - 350 gold (anti rob 1 jam)
.shop heal - 100 gold (+50 HP)
.shop dungeon - 50 gold (reset cooldown)`,
    });
  }

  if (item === "limit") {
    if (user.gold < 150)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 150;
    user.limit += 5;
  } else if (item === "shield") {
    if (user.gold < 350)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 350;
    user.shielduntil = Date.now() + 3600000;
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
  } else {
    return sock.sendMessage(from, { text: "Item tidak ditemukan." });
  }

  await saveUser(sender, user);

  return sock.sendMessage(from, { text: `Pembelian ${item} berhasil.` });
};
