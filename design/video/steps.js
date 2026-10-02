// Walkthrough script for the Sohana POS demo. Captions: Roman Urdu first (for
// the client), English second. Each cap() shows until the next one.
module.exports = async ({ tap, type, hold, scroll, cap }) => {
  // 1. Home
  cap("Yeh hai aap ki dukaan ka Home screen", "Home: today's sale, cash in hand and udhaar at a glance", "1/7  HOME");
  await hold(3.6);
  cap("Kam stock ka alert khud aa jata hai", "Low stock alert shows by itself", "1/7  HOME");
  await scroll(330, 1.6); await hold(2.2);
  cap("Har bill yahan, tap karein to memo khulta hai", "Recent bills, tap one to open its memo", "1/7  HOME");
  await scroll(320, 1.4); await hold(1.6);

  // 2. All bills
  cap("Saare bill ek jagah: aaj, 7 din ya sab", "All bills: Today / 7 days / All", "2/7  ALL BILLS");
  await tap("See all bills", { wait: 1.6 });
  await tap("tab:Today", { wait: 1.4 });
  await tap("tab:7 days", { wait: 1.2 });
  cap("Dukaan ka naam ya bill number se dhoondein", "Search by shop name or bill number", "2/7  ALL BILLS");
  await type("ph:Search customer or bill number", "Shah");
  await hold(1.6);
  await tap("label:Back", { wait: 0.8 });

  // 3. New bill
  cap("Naya bill: pehle dukaan chunein", "New bill: first choose the shop", "3/7  NEW BILL");
  await tap("tab:New Bill", { wait: 1.0 });
  await tap("Tap to choose customer", { wait: 0.9 });
  await type("ph:Search name or phone", "Bismillah");
  await tap("Bismillah Kiryana Store", { wait: 0.8 });
  cap("Dukaan ka pichla udhaar khud nazar aata hai", "The shop's previous balance shows by itself", "3/7  NEW BILL");
  await hold(2.2);
  cap("Item par tap karein, bill mein add ho jata hai", "Tap an item to add it, tap again for one more", "3/7  NEW BILL");
  await tap("label:Add Washing Powder 1kg", { wait: 0.6 });
  await tap("label:Add Washing Powder 1kg", { wait: 0.6 });
  await tap("label:Add Washing Tel 1L", { wait: 0.9 });
  cap("Quantity aur rate jab chahein badal lein", "Change quantity or rate any time", "3/7  NEW BILL");
  await type("label:Quantity", "12");
  await hold(1.0);
  cap("Discount aur jo cash mila woh likhein", "Enter the discount and the cash received", "3/7  NEW BILL");
  await type("ph:e.g. 100", "100");
  await type("ph:e.g. 5000", "5000");
  cap("Baqi udhaar app khud calculate karti hai", "The app works out the remaining balance", "3/7  NEW BILL");
  await scroll(420, 1.4); await hold(2.4);
  await tap("Save and show memo", { wait: 1.2 });

  // 4. Memo
  cap("58mm printer wala memo tayyar", "The 58mm printer memo is ready", "4/7  MEMO");
  await hold(1.6);
  await scroll(520, 2.6); await hold(1.0);
  await scroll(-520, 1.0);
  cap("Ek tap mein Urdu memo", "One tap for the Urdu memo", "4/7  MEMO");
  await tap("tab:اردو", { wait: 2.6 });
  await scroll(560, 2.2); await hold(0.6);
  cap("Memo WhatsApp par seedha customer ko", "Send the memo to the customer on WhatsApp", "4/7  MEMO");
  await tap("Send memo on WhatsApp", { fake: true, wait: 1.6 });
  cap("Bluetooth printer par memo print", "Print the memo on the Bluetooth printer", "4/7  MEMO");
  await tap("Print 58mm memo", { fake: true, wait: 1.6 });
  cap("Stock se zyada maal bechne nahi deti", "It won't let you sell more than you have", "4/7  MEMO");
  await tap("New bill", { wait: 0.8 });
  await tap("Tap to choose customer", { wait: 0.8 });
  await type("ph:Search name or phone", "Usman");
  await tap("Usman Store", { wait: 0.5 });
  await tap("label:Add Soda 25kg", { wait: 0.4 });
  await type("label:Quantity", "50", { clear: true });
  await tap("Save and show memo", { wait: 2.8 });
  await tap("Clear bill", { wait: 0.6 });

  // 5. Khata
  cap("Khata: kis dukaan ka kitna udhaar", "Khata: who owes you how much", "5/7  KHATA");
  await tap("tab:Khata", { wait: 2.0 });
  await scroll(300, 1.2); await hold(0.6);
  cap("Suppliers ka hisaab bhi alag", "Suppliers have their own khata", "5/7  KHATA");
  await tap("tab:Suppliers", { wait: 1.6 });
  await tap("tab:Customers", { wait: 0.6 });
  cap("Har dukaan ki poori history", "The full history of every shop", "5/7  KHATA");
  await type("ph:Search name or phone", "Bismillah");
  await tap("Bismillah Kiryana Store", { wait: 2.2 });
  cap("Wasooli likhein, udhaar khud kam", "Record a payment, the udhaar goes down", "5/7  KHATA");
  await tap("Receive", { wait: 0.8 });
  await type("ph:e.g. 5000", "5000");
  await tap("Save", { wait: 2.0 });
  cap("Khata bhi WhatsApp par bhej dein", "Send the khata statement on WhatsApp", "5/7  KHATA");
  await tap("Send khata on WhatsApp", { fake: true, wait: 1.6 });
  await tap("label:Back", { wait: 0.6 });
  cap("Nayi dukaan ya supplier add karein", "Add a new shop or supplier", "5/7  KHATA");
  await tap("Add", { wait: 2.0 });
  await tap("label:Close", { wait: 0.6 });

  // 6. Stock
  cap("Stock: kaun sa maal kitna bacha hai", "Stock: what is left of each item", "6/7  STOCK");
  await tap("tab:Stock", { wait: 2.2 });
  cap("Maal aaya? Stock In karein", "New stock arrived? Use Stock In", "6/7  STOCK");
  await tap("Stock In (maal aaya)", { wait: 0.8 });
  await tap("Soda 25kg", { wait: 0.4 });
  await type("ph:e.g. 20", "10");
  await type("ph:e.g. 2100", "2400");
  await tap("Lever Distributor Hyderabad", { wait: 0.4 });
  await type("ph:e.g. 0 if on credit", "5000");
  await tap("Save stock", { wait: 0.8 });
  cap("Stock aur supplier ka khata dono update", "Stock and the supplier's khata both update", "6/7  STOCK");
  await hold(1.6);
  await scroll(700, 1.8); await hold(1.0);

  // 7. Cash
  cap("Galle ka hisaab: cash in hand", "Cash in hand, always up to date", "7/7  CASH");
  await tap("tab:Cash", { wait: 2.0 });
  cap("Roz ka kharch ek tap mein", "Daily expenses in one tap", "7/7  CASH");
  await tap("Cash Out", { wait: 0.7 });
  await type("ph:e.g. 500", "500");
  await tap("Tea / Food", { wait: 0.4 });
  await tap("Save", { wait: 1.8 });
  await tap("tab:All", { wait: 1.6 });

  // Back home
  cap("Sab kuch Home par khud update", "Everything adds up on Home by itself", "HOME");
  await tap("tab:Home", { wait: 3.4 });
};
