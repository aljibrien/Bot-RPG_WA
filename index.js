import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import P from "pino";
import config from "./config.js";
import qrcode from "qrcode-terminal";
import { isRegistered, getUser, isPremium, saveDB } from "./utils.js";

import register from "./handler/register.js";
import fish from "./handler/fish.js";
import rob from "./handler/rob.js";
import dungeon from "./handler/dungeon.js";
import bank from "./handler/bank.js";
import user from "./handler/user.js";
import leaderboard from "./handler/leaderboard.js";
import shop from "./handler/shop.js";
import give from "./handler/give.js";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
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
    if (command !== "daftar" && !isRegistered(sender)) {
      return sock.sendMessage(from, {
        text: "Kamu belum terdaftar. Ketik .daftar dulu.",
      });
    }

    const userData = getUser(sender);
    const now = Date.now();
    const oneDay = 86400000;

    // ======================
    // RESET LIMIT HARIAN
    // ======================
    if (userData && now - userData.lastReset > oneDay) {
      if (!isPremium(userData)) {
        userData.limit = 30;
      }
      userData.lastReset = now;
    }

    // ======================
    // LIMIT & PREMIUM
    // ======================
    if (userData && !["daftar", "help", "lb", "shop", "me"].includes(command)) {
      if (!isPremium(userData)) {
        if (userData.limit <= 0) {
          return sock.sendMessage(from, {
            text: "Limit harian habis. Upgrade premium.",
          });
        }
        userData.limit--;
      }
    }

    // ======================
    // ANTI SPAM
    // ======================
    if (userData) {
      if (now - userData.lastCommand < 1000) {
        userData.spamCount++;
        if (userData.spamCount >= 5) {
          return sock.sendMessage(from, {
            text: "Spam terdeteksi. Pelan-pelan.",
          });
        }
      } else {
        userData.spamCount = 0;
      }

      userData.lastCommand = now;
      saveDB();
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
──── ୨୧ User ୨୧ ────
╰┈➤ .me
╰┈➤ .give
╰┈➤ .lb (leaderboard)`,
        });

      case "addprem":
        if (sender !== config.owner) return;

        let days;
        let target;

        // Cek apakah ada mention
        const mentioned =
          msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (mentioned) {
          // Format: .addprem 30 @tag
          days = parseInt(args[1]);
          target = mentioned;
        } else {
          // Format: .addprem 08xxxx 30
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
          return sock.sendMessage(from, { text: "Jumlah hari tidak valid." });

        const targetUser = getUser(target);
        if (!targetUser)
          return sock.sendMessage(from, { text: "User belum terdaftar." });

        targetUser.premium = true;
        targetUser.premiumExpire = Date.now() + days * 86400000;

        saveDB();

        return sock.sendMessage(from, {
          text: `Premium ${days} hari berhasil diberikan.`,
        });

      default:
        return;
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

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
