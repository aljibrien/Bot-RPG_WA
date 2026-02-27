import { getUser, saveUser, useLimit } from "../utils.js";

export default async (sock, from, sender, msg, args, type) => {
  const user = await getUser(sender);
  if (!user)
    return sock.sendMessage(from, {
      text: "Ketik .daftar dulu bro, jangan nyelonong.",
    });

  const now = Date.now();

  // 🚫 Lagi aktivitas berbahaya
  if (
    (user.robend && user.robend > now) ||
    (user.hackend && user.hackend > now)
  ) {
    return sock.sendMessage(from, {
      text: "Lagi ribut di lapangan, bank tutup dulu 🏦🚫",
    });
  }

  const amount = parseInt(args[1]);
  if (!amount || amount <= 0)
    return sock.sendMessage(from, {
      text: "Masukin angka yang bener dong.",
    });

  if (type === "deposit") {
    if (user.gold < amount)
      return sock.sendMessage(from, {
        text: "Gold lu kagak cukup buat disimpen 😭",
      });

    user.gold -= amount;
    user.bank += amount;
  } else if (type === "withdraw") {
    if (user.bank < amount)
      return sock.sendMessage(from, {
        text: "Isi bank lu segitu doang, jangan halu.",
      });

    user.bank -= amount;
    user.gold += amount;
  } else {
    return sock.sendMessage(from, {
      text: "Tipe transaksi nggak dikenal.",
    });
  }

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(
    from,
    {
      text:
        type === "deposit"
          ? `Berhasil nyimpen ${amount} gold ke bank 🏦`
          : `Berhasil narik ${amount} gold dari bank 💰`,
    },
    { quoted: msg },
  );
};
