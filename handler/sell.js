import { getUser, saveDB, useLimit } from "../utils.js";

const priceList = {
  kecil: 10,
  sedang: 25,
  besar: 50,
  legend: 200,
};

export default async (sock, from, sender, args) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const type = args[1]?.toLowerCase();

  // =========================
  // SELL ALL
  // =========================
  if (type === "all") {
    const { kecil, sedang, besar, legend } = user.fish;

    const totalFish = kecil + sedang + besar + legend;

    if (totalFish <= 0)
      return sock.sendMessage(from, { text: "Ikan kamu kosong." });

    const total =
      kecil * priceList.kecil +
      sedang * priceList.sedang +
      besar * priceList.besar +
      legend * priceList.legend;

    user.gold += total;

    user.fish = {
      kecil: 0,
      sedang: 0,
      besar: 0,
      legend: 0,
    };
    useLimit(user);
    saveDB();

    return sock.sendMessage(from, {
      text: `Semua ikan terjual!
+${total} gold`,
    });
  }

  // =========================
  // SELL SPESIFIK
  // =========================
  const amount = parseInt(args[2]);

  if (!priceList[type])
    return sock.sendMessage(from, {
      text: "Tipe ikan salah. Gunakan: kecil / sedang / besar / legend",
    });

  if (!amount || amount <= 0)
    return sock.sendMessage(from, {
      text: "Masukkan jumlah yang valid.",
    });

  if (user.fish[type] < amount)
    return sock.sendMessage(from, {
      text: `Ikan ${type} kamu tidak cukup.`,
    });

  const total = amount * priceList[type];

  user.fish[type] -= amount;
  user.gold += total;
  useLimit(user);
  saveDB();

  return sock.sendMessage(from, {
    text: `Berhasil menjual ${amount} ikan ${type}.
+${total} gold`,
  });
};
