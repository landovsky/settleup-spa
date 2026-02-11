# Bill Splitter

Bill-splitting app with a bold, playful design that avoids generic AI aesthetics.

## Design Highlights

- **Typography:** Archivo Black for bold headers paired with DM Sans for clean readability
- **Color palette:** Warm terracotta orange (`#FF6B35`) with deep navy (`#004E89`) and golden yellow accents — no generic purple gradients
- **Smooth animations:** Subtle fade-ins, slide-ins, and micro-interactions on hover
- **Asymmetric layout:** The balance card features a gradient with floating circles for depth

## Features

- **Multi-person splitting** — add any number of people, not just two
- **Fair share calculation** — automatically divides total expenses equally among all participants
- **Settle up** — record settlements directly from the balance card and track them in history
- **Minimum transfers** — uses a greedy algorithm to compute the fewest payments needed to settle all debts
- **Persistent storage** using localStorage — your data survives browser refreshes
- **Expense tracking** with description, amount, who paid, and date
- **Quick deletion** of any expense or settlement (undo)
- **Responsive design** that works on mobile and desktop
- **Keyboard shortcuts** — press Enter to jump between fields
- **Data migration** — automatically upgrades old 2-person data to the new format

The balance automatically calculates based on the principle that each person should pay an equal share of total expenses. With 3 people and $150 in total expenses, each person's fair share is $50. If Alice paid $100, Bob paid $30, and Charlie paid $20, the app computes the minimum transfers: Bob owes Alice $20, Charlie owes Alice $30.
