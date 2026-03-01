import { isRegistered, registerUser } from "../utils.js";

export default async (sock, from, sender, msg, args) => {
  if (await isRegistered(sender)) {
    return sock.sendMessage(from, {
      text: "Ngapain daftar lagi? sudah terdaftar kocak",
    });
  }

  const nameInput = args.slice(1).join(" ");
  const finalName = nameInput || msg.pushName || "Player";

  await registerUser(sender, finalName);

  return sock.sendMessage(
    from,
    {
      text: `Pendaftaran berhasil.\nNama kamu: ${finalName}\nKamu dapat 100 gold awal.`,
    },
    { quoted: msg },
  );
};
