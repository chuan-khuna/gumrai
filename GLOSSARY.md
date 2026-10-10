# Gumrai (กำไร)

Helps a seller work out cost, selling price and profit for each thing they sell, using a reusable list of what they buy.

## Language

### People

**Seller** (ผู้ขาย):
A person who signs in, with email and password or with Discord, and keeps their own Cost List, Cost Categories and Cost Sheets. Both ways of signing in can be bound to the same Seller. No Seller sees another Seller's data.
_Avoid_: user, account (alone)

**Display Name** (ชื่อที่แสดง):
The name a Seller is shown by, which they set themselves. It starts as their Discord name, or as what they typed when signing up with email, and never follows Discord afterwards.

### Costs

**Cost List** (ลิสต์ต้นทุน):
The seller's saved list of Cost Items, reused across Cost Sheets.

**Cost Item** (รายการต้นทุน):
One thing the seller buys, with a name, a Unit Cost and a Unit, such as มัทฉะ at 4 ฿/g. Its name is unique in the Cost List, ignoring case and surrounding spaces.
_Avoid_: สินค้า, product (these mean what is sold)

**Unit Cost** (ต้นทุนต่อหน่วย):
What one Unit of a Cost Item costs, in baht.
_Avoid_: price (that is the selling price)

**Unit** (หน่วย):
A free-text label for what one unit of cost means, such as `g`, `ml` or `ชิ้น`. It is only a label: nothing converts between units.
_Avoid_: unit of measure (implies conversion)

**Cost Category** (หมวดต้นทุน):
A group the seller names themselves, such as วัตถุดิบ or บรรจุภัณฑ์. A Cost Item or Manual Line belongs to at most one, or to none (shown as ไม่มีหมวด).
_Avoid_: tag (a cost cannot have several)

### Selling

**Cost Sheet** (ชีตต้นทุน):
A saved costing of one thing the seller sells: its cost lines, selling price and the profit left. A seller keeps many.

**Sale Unit** (หน่วยขาย):
What one sale of a Cost Sheet's thing is called, named by the seller per sheet, such as แก้ว or กล่อง. Every per-sale figure on the sheet is per one Sale Unit, labelled with its name (ใช้ต่อแก้ว, กำไรต่อแก้ว).
_Avoid_: cup, ชิ้น (as fixed words)

**Selling Price** (ราคาขาย):
The price of one Sale Unit, typed by the seller. The sheet works out profit from it, never the other way round.
_Avoid_: price (alone), target price

**GP** (ค่าคอมแพลตฟอร์ม):
The commission a selling platform deducts, as a percentage of the Selling Price. Each Cost Sheet has one, 0% when selling direct. It is a commission, not gross profit.
_Avoid_: gross profit

**Platform Take** (ส่วนที่แพลตฟอร์มหัก):
GP × (1 + VAT): everything withheld from the Selling Price. VAT is charged on the commission, not on the price, so a 33% GP takes 35.31%.

**Net Receipt** (เงินที่ได้รับจริง):
The Selling Price less the Platform Take: what actually reaches the seller.
_Avoid_: revenue, ยอดขาย

**Net Profit** (กำไรสุทธิ):
What one Sale Unit leaves: Net Receipt less the total of the sheet's Cost Lines. Negative is a loss. "Net" means net of the platform and the Cost Lines only, not of rent or wages.
_Avoid_: margin, markup

**Cost Line** (บรรทัดต้นทุน):
One cost on a Cost Sheet: a Unit Cost times the Quantity Used.

**Quantity Used** (ใช้ต่อหน่วยขาย):
How many Units of a cost one Sale Unit uses, such as 4 g of มัทฉะ per แก้ว. It is either a Linked Line or a Manual Line.

**Linked Line** (บรรทัดที่ลิงก์):
A Cost Line that takes its name, Unit Cost, Unit and Cost Category from a Cost Item, so changing the Cost Item changes every sheet that uses it. Unlinking it, or deleting its Cost Item, turns it into a Manual Line holding the values it had.

**Manual Line** (รายการพิมพ์เอง):
A Cost Line whose values are typed on the sheet itself, either because nothing in the Cost List fits or because it was unlinked. It can be saved into the Cost List on demand.
