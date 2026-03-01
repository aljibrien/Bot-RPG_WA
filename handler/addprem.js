import { getUser, saveUser } from "../utils.js";
import config from "../config.js";

export default async (sock, from, sender, msg, args) => {
  // 🔥 Owner only
  if (sender !== config.owner)
    return sock.sendMessage(
      from,
      { text: "🚫 Akses ditolak.\nFitur ini khusus Owner." },
      { quoted: msg },
    );

  if (!user) {
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });
  }

  if (!args[1])
    return sock.sendMessage(
      from,
      { text: "Contoh: .addprem @tag 7 atau .addprem 628xxx 7" },
      { quoted: msg },
    );

  let jid;
  let target;

  // 🔥 Kalau pakai tag
  if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    jid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    target = jid.split("@")[0];
  } else {
    // 🔥 Kalau pakai nomor langsung
    target = args[1].replace(/[^0-9]/g, "");
    jid = target + "@s.whatsapp.net";

    // otomatis ubah 08 jadi 62
    // if (target.startsWith("08")) {
    //   target = "62" + target.slice(1);
    // }
  }

  const days = parseInt(args[2]);
  if (!days || isNaN(days))
    return sock.sendMessage(
      from,
      { text: "Masukkan jumlah hari. Contoh: .addprem @tag 7" },
      { quoted: msg },
    );

  const user = await getUser(target);
  if (!user)
    return sock.sendMessage(
      from,
      { text: "Target belum terdaftar." },
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
      text: `✅ @${target} sekarang premium selama ${days} hari.`,
      mentions: [jid],
    },
    { quoted: msg },
  );
};
