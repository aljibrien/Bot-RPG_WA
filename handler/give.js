import { getUser, saveUser, useLimit } from "../utils.js";

export default async (sock, from, sender, msg, args) => {
  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split(
      "@",
    )[0];

  const amount = parseInt(args[1]);
  if (!target || !amount || amount <= 0)
    return sock.sendMessage(from, { text: "Format: .give 100 @tag" });

  const giver = await getUser(sender);
  const receiver = await getUser(target);

  if (!giver)
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });
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
      text: `Transfer ${amount} gold berhasil.`,
      mentions: [sender, target],
    },
    { quoted: msg },
  );
};
