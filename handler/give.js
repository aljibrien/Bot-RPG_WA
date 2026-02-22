import { getUser, saveDB } from "../utils.js";
import config from "../config.js";

export default async (sock, from, msg, sender, args) => {
  const mentioned =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

  const amount = parseInt(args[1]);

  if (!mentioned || !amount || amount <= 0) {
    return sock.sendMessage(from, {
      text: "Format: .give 1000 @tag",
    });
  }

  const giver = getUser(sender);
  const targetUser = getUser(mentioned);

  if (!giver) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  if (!targetUser)
    return sock.sendMessage(from, { text: "Target belum terdaftar." });

  // Kalau bukan owner → cek saldo
  //   if (sender !== config.owner) {
  //     if (giver.gold < amount) {
  //       return sock.sendMessage(from, {
  //         text: "Gold kamu tidak cukup.",
  //       });
  //     }

  //     giver.gold -= amount;
  //   }

  if (giver.gold < amount) {
    return sock.sendMessage(from, {
      text: "Gold kamu tidak cukup.",
    });
  }

  giver.gold -= amount;

  targetUser.gold += amount;

  saveDB();

  return sock.sendMessage(from, {
    text: `@${sender.split("@")[0]} mengirim ${amount} gold ke @${mentioned.split("@")[0]}`,
    mentions: [sender, mentioned],
  });
};
