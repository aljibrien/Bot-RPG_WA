import { getUser, saveDB, useLimit } from "../utils.js";

export default async (sock, from, sender, args, type) => {
  const user = getUser(sender);
  if (!user) return sock.sendMessage(from, { text: "Ketik .daftar dulu." });

  const amount = parseInt(args[1]);
  if (!amount || amount <= 0)
    return sock.sendMessage(from, { text: "Masukkan jumlah valid." });

  if (type === "deposit") {
    if (user.gold < amount)
      return sock.sendMessage(from, { text: "Gold tidak cukup." });

    user.gold -= amount;
    user.bank += amount;
    useLimit(user);
    saveDB();

    return sock.sendMessage(from, { text: `Deposit ${amount} gold.` });
  }

  if (type === "withdraw") {
    if (user.bank < amount)
      return sock.sendMessage(from, { text: "Saldo bank tidak cukup." });

    user.bank -= amount;
    user.gold += amount;
    useLimit(user);
    saveDB();

    return sock.sendMessage(from, { text: `Withdraw ${amount} gold.` });
  }
};
