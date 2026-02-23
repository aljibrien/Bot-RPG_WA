import { getUser, saveDB } from "../utils.js";

export default async (sock, from, sender, args) => {
  const user = getUser(sender);
  if (!user) return;

  const item = args[1];

  if (!item) {
    return sock.sendMessage(from, {
      text: `🛒 SHOP LIST:
.limit - 150 gold (+5 limit)
.shield - 350 gold (anti rob 1 jam)
.heal - 100 gold (+50 HP)
.dungeon - 200 gold (reset cooldown)`,
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
    user.shieldUntil = Date.now() + 3600000;
  } else if (item === "heal") {
    if (user.gold < 100)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 100;
    user.hp += 50;
  } else if (item === "dungeon") {
    if (user.gold < 200)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= 200;
    user.lastDungeon = 0;
  } else {
    return sock.sendMessage(from, { text: "Item tidak ditemukan." });
  }

  saveDB();
  return sock.sendMessage(from, {
    text: `Pembelian ${item} berhasil.`,
  });
};
