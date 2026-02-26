import { isRegistered, registerUser } from "../utils.js";

export default async (sock, from, sender, msg) => {
  if (await isRegistered(sender)) {
    return sock.sendMessage(from, { text: "Kamu sudah terdaftar." });
  }

  await registerUser(sender);

  return sock.sendMessage(
    from,
    {
      text: "Pendaftaran berhasil.\nKamu dapat 100 gold awal.",
    },
    { quoted: msg },
  );
};
