import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/wordmark'
import { categoryColour } from '@/lib/category-colours'
import { platformTakeRate } from '@/lib/delivery'
import { computeSheet } from '@/lib/sheet'
import { currentSeller } from '@/server/auth/auth'
import { requestClient } from '@/server/db/request-client'

// The public landing page: anyone may open it, and a signed-in Seller stays here too. Only the
// main button changes: เริ่มใช้งาน to /login for a visitor, ไปที่ชีตต้นทุน to /sheets for a Seller.
// Reading the session cookies makes the page render on every request.
//
// The worked example is a real calculation (computeSheet), so its figures always add up.

const baht = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat('th-TH', { style: 'percent', maximumFractionDigits: 2 })

const SAMPLE_CATEGORY_SLOTS: Record<string, number> = { ingredients: 0, packaging: 1 }
const SAMPLE = computeSheet({
  sellingPrice: 60,
  gpPercent: 25,
  vatPercent: 7,
  lines: [
    { id: 'matcha', categoryId: 'ingredients', name: 'มัทฉะ', unit: 'g', unitCost: 4, quantityUsed: 4 },
    { id: 'milk', categoryId: 'ingredients', name: 'นมสด', unit: 'ml', unitCost: 0.06, quantityUsed: 150 },
    { id: 'cup', categoryId: 'packaging', name: 'แก้วพร้อมฝา', unit: 'ชิ้น', unitCost: 3.5, quantityUsed: 1 },
    { id: 'ice', categoryId: 'ingredients', name: 'น้ำแข็ง', unit: 'ถุง', unitCost: 1.5, quantityUsed: 1 },
  ],
})

// The commission example from GLOSSARY.md (Platform Take): a 33% GP takes 35.31%.
const EXAMPLE_GP = 0.33
const EXAMPLE_TAKE = platformTakeRate({ gpRate: EXAMPLE_GP, vatRate: 0.07 })

export default async function LandingPage() {
  const db = await requestClient()
  const seller = await currentSeller(db)

  const destination = seller ? { href: '/sheets', label: 'ไปที่ชีตต้นทุน' } : { href: '/login', label: 'เริ่มใช้งาน' }

  return (
    <main className="mx-auto max-w-5xl overflow-x-clip px-4">
      <section className="grid gap-12 pt-12 pb-16 sm:pt-20 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-10 md:pb-24">
        <div className="min-w-0">
          <Wordmark className="text-7xl sm:text-8xl lg:text-9xl" />
          <h1 className="mt-6 text-3xl sm:text-4xl">
            ขายหนึ่งแก้ว เหลือกำไรจริง<span className="whitespace-nowrap">เท่าไหร่</span>
          </h1>
          <p className="mt-4 max-w-[34rem] text-lg leading-[1.7] text-muted-foreground">
            ใส่ของที่ซื้อมา ราคาขาย และค่าคอมแพลตฟอร์ม กำไรคิดให้ทีละรายการที่คุณขาย ละเอียดถึงสตางค์
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Button asChild size="lg">
              <Link href={destination.href}>{destination.label}</Link>
            </Button>
            {seller && (
              <span className="min-w-0 truncate text-sm text-muted-foreground">
                เข้าสู่ระบบอยู่ในชื่อ {seller.displayName}
              </span>
            )}
          </div>
        </div>

        <SampleSheet />
      </section>

      <section
        aria-labelledby="landing-notes"
        className="grid gap-10 border-t border-dashed border-border py-16 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-12"
      >
        <h2 id="landing-notes" className="sr-only">
          สิ่งที่ชีตต้นทุนคิดให้
        </h2>
        <div className="grid content-start gap-4 rounded-2xl bg-muted p-6 sm:p-8">
          <h3 className="text-2xl">ค่าคอมไม่ได้หักแค่ที่เห็น</h3>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heading text-5xl leading-[1.25] font-semibold tabular-nums">
              {percent.format(EXAMPLE_TAKE)}
            </span>
            <span className="text-sm text-muted-foreground">
              ที่หักจริงเมื่อ GP {percent.format(EXAMPLE_GP)}
            </span>
          </p>
          <p className="leading-[1.7]">
            แพลตฟอร์มคิด VAT 7% บนค่าคอมด้วย ชีตจึงหักทั้งสองอย่างออกจากราคาขายก่อน แล้วคิดกำไรจากเงินที่ได้รับจริง
          </p>
        </div>
        <div className="grid content-start gap-4 md:pt-8">
          <h3 className="text-2xl">ราคาวัตถุดิบขึ้น แก้ที่เดียว</h3>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-heading text-base">มัทฉะ</span>
            <span className="tabular-nums text-muted-foreground">4 ฿/g</span>
            <Badge variant="linked">ลิงก์ลิสต์</Badge>
          </p>
          <p className="leading-[1.7] text-muted-foreground">
            เก็บของที่ซื้อประจำไว้ในลิสต์ต้นทุน แล้วลิงก์เข้าชีต พอแก้ราคาในลิสต์ ทุกชีตที่ใช้ก็เปลี่ยนตาม
          </p>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border py-10">
        <p className="min-w-0">
          <span className="font-heading text-lg font-semibold">กำไร</span>
          <span className="ml-3 text-sm text-muted-foreground">คิดต้นทุนและกำไรของสิ่งที่คุณขาย</span>
        </p>
        <Button asChild variant="secondary">
          <Link href={destination.href}>{destination.label}</Link>
        </Button>
      </footer>
    </main>
  )
}

// A worked Cost Sheet, tilted off the grid: the page's one designed exception.
function SampleSheet() {
  const { platform, lines, totalCost, netProfit } = SAMPLE
  return (
    <article
      aria-label="ตัวอย่างชีตต้นทุน"
      className="w-full max-w-md min-w-0 justify-self-center rounded-2xl bg-card p-6 shadow-lift transition-[rotate,translate] duration-200 ease-spring -rotate-2 hover:-translate-y-1 hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:-rotate-2 md:justify-self-end"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-heading text-lg">มัทฉะลาเต้เย็น</p>
        <Badge variant="manual">ตัวอย่าง</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 text-sm">
        <dt className="py-2 text-muted-foreground">ราคาขายต่อแก้ว</dt>
        <dd className="py-2 text-right tabular-nums">{baht.format(platform.price)} ฿</dd>
        <dt className="border-t border-dashed border-border py-2 text-muted-foreground">
          ส่วนที่แพลตฟอร์มหัก (GP 25% + VAT 7%)
        </dt>
        <dd className="border-t border-dashed border-border py-2 text-right tabular-nums">
          −{baht.format(platform.totalDeduction)} ฿
        </dd>
        <dt className="border-t border-dashed border-border py-2 text-muted-foreground">เงินที่ได้รับจริง</dt>
        <dd className="border-t border-dashed border-border py-2 text-right tabular-nums">
          {baht.format(platform.netReceipt)} ฿
        </dd>
      </dl>

      <div className="mt-3 rounded-xl bg-muted px-4 py-3">
        <ul className="grid gap-1.5 text-sm">
          {lines.map((line) => (
            <li key={line.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: categoryColour(SAMPLE_CATEGORY_SLOTS[line.categoryId ?? ''] ?? null) }}
              />
              <span className="truncate">
                {line.name} {line.quantityUsed} {line.unit}
              </span>
              <span className="text-right tabular-nums">{baht.format(line.cost)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between gap-3 border-t border-dashed border-border pt-2 text-sm text-muted-foreground">
          <span>ต้นทุนต่อแก้ว</span>
          <span className="tabular-nums">{baht.format(totalCost)} ฿</span>
        </p>
      </div>

      <div className="mt-4 grid gap-1 rounded-2xl bg-profit-surface p-5">
        <span className="text-sm">กำไรสุทธิต่อแก้ว</span>
        <span className="font-heading text-5xl leading-tight font-semibold text-profit tabular-nums">
          <span className="bg-[linear-gradient(transparent_62%,var(--color-highlight)_62%)] px-1">
            {baht.format(netProfit)}
          </span>
          <small className="ml-1 text-2xl">฿</small>
        </span>
        <span className="text-sm text-muted-foreground">{percent.format(netProfit / platform.price)} ของราคาขาย</span>
      </div>
    </article>
  )
}
