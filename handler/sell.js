import { getUser, saveUser, useLimit } from "../utils.js";

const price = {
  kecil: 10,
  sedang: 30,
  besar: 80,
  legend: 400,
};

export default async (sock, from, sender, msg, args) => {
  const user = await getUser(sender);
  if (!user) {
    return sock.sendMessage(from, {
      text: "⚠️ Akun belum terdaftar.\nKetik .daftar NamaAnda",
    });
  }

  const type = args[1]?.toLowerCase();

  if (!type) {
    return sock.sendMessage(
      from,
      {
        text: `╔═══ 🎣 SELL LIST ═══╗

🐟 Harga Ikan
⟢ kecil  → ${price.kecil} gold
⟢ sedang → ${price.sedang} gold
⟢ besar  → ${price.besar} gold
⟢ legend → ${price.legend} gold

Format:
⟢ sell [tipe] [jumlah]
⟢ sell all

╚══════════▣`,
      },
      { quoted: msg },
    );
  }

  if (type === "all") {
    const totalFish = user.kecil + user.sedang + user.besar + user.legend;

    if (totalFish <= 0)
      return sock.sendMessage(from, { text: "Ikan kamu kosong." });

    const total =
      user.kecil * price.kecil +
      user.sedang * price.sedang +
      user.besar * price.besar +
      user.legend * price.legend;

    user.gold += total;
    user.kecil = 0;
    user.sedang = 0;
    user.besar = 0;
    user.legend = 0;

    useLimit(user);
    await saveUser(sender, user);

    return sock.sendMessage(from, {
      text: `Semua ikan terjual!\n+${total} gold`,
    });
  }

  const amount = parseInt(args[2]);
  if (!price[type]) return sock.sendMessage(from, { text: "Tipe ikan salah." });

  if (!amount || amount <= 0)
    return sock.sendMessage(from, { text: "Jumlah tidak valid." });

  if (user[type] < amount)
    return sock.sendMessage(from, { text: `Ikan ${type} tidak cukup.` });

  const total = amount * price[type];

  user[type] -= amount;
  user.gold += total;

  useLimit(user);
  await saveUser(sender, user);

  return sock.sendMessage(from, {
    text: `Berhasil menjual ${amount} ${type}\n+${total} gold`,
  });
};
