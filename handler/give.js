import { getUser, saveUser, useLimit } from "../utils.js";

export default async (sock, from, sender, msg, args) => {
  const giver = await getUser(sender);
  if (!giver)
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });

  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split(
      "@",
    )[0];

  const amount = parseInt(args[2]);
  if (!target || !amount || amount <= 0)
    return sock.sendMessage(from, { text: "Format: .give @tag 100" });

  const receiver = await getUser(target);
  if (!receiver)
    return sock.sendMessage(from, { text: "Target belum daftar." });

  if (giver.gold < amount)
    return sock.sendMessage(from, { text: "Gold tidak cukup." });

  giver.gold -= amount;
  receiver.gold += amount;

  useLimit(giver);

  await saveUser(sender, giver);
  await saveUser(target, receiver);

  return sock.sendMessage(
    from,
    {
      text: `💰 Transfer berhasil!

@${sender} mengirim ${amount} gold ke @${target}`,
      mentions: [sender + "@s.whatsapp.net", target + "@s.whatsapp.net"],
    },
    { quoted: msg },
  );
};
