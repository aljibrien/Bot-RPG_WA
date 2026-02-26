import { getUser, saveUser } from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg, args) => {
  // 🔥 Hanya Owner
  if (sender !== config.owner)
    return sock.sendMessage(
      from,
      {
        text: "Fitur ini khusus owner.",
      },
      { quoted: msg },
    );

  const target =
    msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

  if (!target)
    return sock.sendMessage(
      from,
      {
        text: "Tag target. Contoh: .addprem @tag 7",
      },
      { quoted: msg },
    );

  const days = parseInt(args[2]);
  if (!days || isNaN(days))
    return sock.sendMessage(
      from,
      {
        text: "Masukkan jumlah hari. Contoh: .addprem @tag 7",
      },
      { quoted: msg },
    );

  const user = await getUser(target);
  if (!user)
    return sock.sendMessage(
      from,
      {
        text: "Target belum terdaftar.",
      },
      { quoted: msg },
    );

  const now = Date.now();
  const duration = days * 24 * 60 * 60 * 1000;

  user.premium = true;
  user.premiumexpire = now + duration;

  await saveUser(target, user);

  return sock.sendMessage(
    from,
    {
      text: `✅ @${target.split("@")[0]} sekarang premium selama ${days} hari.`,
      mentions: [target],
    },
    { quoted: msg },
  );
};
