import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import P from "pino";
import "dotenv/config";
import config from "./config.js";
import qrcode from "qrcode-terminal";

import { isRegistered, getUser, saveUser, isPremium } from "./utils.js";

import register from "./handler/register.js";
import fish from "./handler/fish.js";
import rob from "./handler/rob.js";
import dungeon from "./handler/dungeon.js";
import bank from "./handler/bank.js";
import user from "./handler/user.js";
import leaderboard from "./handler/leaderboard.js";
import shop from "./handler/shop.js";
import give from "./handler/give.js";
import sell from "./handler/sell.js";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg?.message) return;
      if (msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender = isGroup ? msg.key.participant : from;

      const text =
        msg.message.conversation || msg.message.extendedTextMessage?.text;

      if (!text?.startsWith(config.prefix)) return;

      const args = text.trim().split(/\s+/);
      const command = args[0].slice(1).toLowerCase();

      // ======================
      // WAJIB DAFTAR
      // ======================
      if (command !== "daftar" && !(await isRegistered(sender))) {
        return sock.sendMessage(from, {
          text: "Kamu belum terdaftar. Ketik .daftar dulu.",
        });
      }

      const userData = await getUser(sender);
      const now = Date.now();
      const oneDay = 86400000;

      // ======================
      // RESET LIMIT HARIAN
      // ======================
      if (userData && now - userData.lastreset > oneDay) {
        if (!isPremium(userData)) {
          userData.limit = 30;
        }
        userData.lastreset = now;
        await saveUser(sender, userData);
      }

      // ======================
      // LIMIT CHECK (no auto minus di sini!)
      // ======================
      if (
        userData &&
        !["daftar", "help", "lb", "shop", "me"].includes(command)
      ) {
        if (!isPremium(userData)) {
          if (userData.limit <= 0) {
            return sock.sendMessage(from, {
              text: "Limit harian habis. Upgrade premium.",
            });
          }
        }
      }

      // ======================
      // ANTI SPAM
      // ======================
      if (userData) {
        if (now - userData.lastcommand < 1000) {
          userData.spamcount++;
          if (userData.spamcount >= 5) {
            return sock.sendMessage(from, {
              text: "Spam terdeteksi. Pelan-pelan.",
            });
          }
        } else {
          userData.spamcount = 0;
        }

        userData.lastcommand = now;
        await saveUser(sender, userData);
      }

      // ======================
      // ROUTING COMMAND
      // ======================
      switch (command) {
        case "daftar":
          return register(sock, from, sender);

        case "fish":
        case "mancing":
          return fish(sock, from, sender);

        case "dungeon":
          return dungeon(sock, from, sender);

        case "rob":
          return rob(sock, from, msg, sender);

        case "deposit":
          return bank(sock, from, sender, args, "deposit");

        case "withdraw":
          return bank(sock, from, sender, args, "withdraw");

        case "me":
          return user(sock, from, sender);

        case "lb":
          return leaderboard(sock, from);

        case "shop":
          return shop(sock, from, sender, args);

        case "give":
          return give(sock, from, msg, sender, args);

        case "sell":
          return sell(sock, from, sender, args);

        case "help":
          return sock.sendMessage(from, {
            text: `List Command:
⚡︎ .daftar
──── ୨୧ Minigames ୨୧ ────
╰┈➤ .fish
╰┈➤ .dungeon
╰┈➤ .rob @tag
──── ୨୧ BANK ୨୧ ────
╰┈➤ .deposit 100
╰┈➤ .withdraw 100
╰┈➤ .sell kecil 10 (jual ikan sebagian)
╰┈➤ .sell all (jual ikan semuanya)
╰┈➤ .shop
──── ୨୧ User ୨୧ ────
╰┈➤ .me
╰┈➤ .give @tag
╰┈➤ .lb (leaderboard)`,
          });

        case "addprem": {
          if (sender !== config.owner) return;

          let days;
          let target;

          const mentioned =
            msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentioned) {
            days = parseInt(args[1]);
            target = mentioned;
          } else {
            const number = args[1];
            days = parseInt(args[2]);

            if (!number || !days) {
              return sock.sendMessage(from, {
                text: "Format:\n.addprem 30 @tag\natau\n.addprem 08xxxx 30",
              });
            }

            const formatted = number.replace(/^0/, "62");
            target = formatted + "@s.whatsapp.net";
          }

          if (!days || days <= 0)
            return sock.sendMessage(from, {
              text: "Jumlah hari tidak valid.",
            });

          const targetUser = await getUser(target);
          if (!targetUser)
            return sock.sendMessage(from, {
              text: "User belum terdaftar.",
            });

          targetUser.premium = true;
          targetUser.premiumexpire = Date.now() + days * 86400000;

          await saveUser(target, targetUser);

          return sock.sendMessage(from, {
            text: `Premium ${days} hari berhasil diberikan.`,
          });
        }

        default:
          return;
      }
    } catch (err) {
      console.error("ERROR:", err);
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("Bot tersambung.");
    }

    if (connection === "close") {
      console.log("Koneksi tertutup. Reconnecting...");
      startBot();
    }
  });
}

startBot();
