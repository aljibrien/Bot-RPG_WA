import { isRegistered, registerUser } from "../utils.js";

export default async (sock, from, sender, msg) => {
  if (await isRegistered(sender)) {
    return sock.sendMessage(from, {
      text: "Ngapain daftar lagi? sudah terdaftar kocak",
    });
  }
  const pushName = msg.pushName || "Player";
  await registerUser(sender, pushName);

  return sock.sendMessage(
    from,
    {
      text: "Pendaftaran berhasil.\nKamu dapat 100 gold awal.",
    },
    { quoted: msg },
  );
};
