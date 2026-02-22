import { getUser, saveDB } from "../utils.js";

export default async (sock, from, sender) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const { kecil, sedang, besar, legend } = user.fish;

  const totalFish = kecil + sedang + besar + legend;

  if (totalFish <= 0)
    return sock.sendMessage(from, { text: "Ikan kamu kosong." });

  const total = kecil * 10 + sedang * 25 + besar * 50 + legend * 200;

  user.gold += total;

  user.fish = {
    kecil: 0,
    sedang: 0,
    besar: 0,
    legend: 0,
  };

  saveDB();

  return sock.sendMessage(from, {
    text: `Ikan terjual!
Kecil: ${kecil}
Sedang: ${sedang}
Besar: ${besar}
Legend: ${legend}

+${total} gold`,
  });
};
