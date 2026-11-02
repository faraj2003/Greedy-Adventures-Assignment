"""
Rebuilds public/demo/sea-view-skydiving-brochure-demo.pdf from the SAME facts as src/lib/knowledge.ts.
Every statement here must appear on https://www.greedyadventures.com/experiences/sea-view-skydiving
(checked 2026-10-31). Usage: python3 scripts/build-demo-brochure.py   (needs reportlab)
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
INK, NAVY, ORANGE, MIST, LINE = HexColor("#17142B"), HexColor("#5B35F2"), HexColor("#F5A524"), HexColor("#F0ECFF"), HexColor("#DCD3FF")
W, H = A4
c = canvas.Canvas("public/demo/sea-view-skydiving-brochure-demo.pdf", pagesize=A4)
c.setTitle("Sea View Skydiving — Experience Brochure (demo material)")
c.setAuthor("Greedy Adventures assignment demo")

def para(text, x, y, width, font="DV", size=9.5, lead=13.5, color=INK):
    c.setFont(font, size); c.setFillColor(color)
    for line in simpleSplit(text, font, size, width):
        c.drawString(x, y, line); y -= lead
    return y

# Header
c.setFillColor(NAVY); c.rect(0, H - 150, W, 150, fill=1, stroke=0)
c.setFillColor(ORANGE); c.rect(40, H - 50, 232, 18, fill=1, stroke=0)
c.setFillColor(white); c.setFont("DVB", 8); c.drawString(46, H - 44, "DEMO MATERIAL — NOT OPERATOR COLLATERAL")
c.setFont("DVB", 24); c.drawString(40, H - 88, "Sea View Skydiving")
c.setFont("DV", 13); c.drawString(40, H - 110, "Tandem jump over Pattaya · Greedy Adventures")
c.setFont("DV", 9.5); c.drawString(40, H - 133, "Exit at 13,000 ft over the Gulf of Thailand · Operated by Dropzone Thailand")

# Key facts
y = H - 180
facts = [("13,000 ft", "Exit altitude"), ("~60 seconds", "Freefall"), ("5–7 minutes", "Under canopy"), ("~3 hours", "At the dropzone")]
bw = (W - 80 - 3 * 10) / 4
for i, (big, small) in enumerate(facts):
    x = 40 + i * (bw + 10)
    c.setFillColor(MIST); c.roundRect(x, y - 44, bw, 54, 6, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("DVB", 12); c.drawString(x + 10, y - 16, big)
    c.setFont("DV", 8.5); c.setFillColor(HexColor("#4b6372")); c.drawString(x + 10, y - 32, small)

# Packages
y -= 76
c.setFillColor(INK); c.setFont("DVB", 13); c.drawString(40, y, "Choose your package"); y -= 8
y = para("Same aircraft, altitude and instructors in every package. Only the media coverage differs.", 40, y - 12, W - 80, size=9)
y -= 6
pk = [
    ("ECO", "THB 9,500 per person", "The jump, nothing else", "Standard tandem jump with no cameras."),
    ("DELUXE", "THB 12,500 per person", "Video and photos included", "Handycam video and photos from your instructor."),
    ("VIP", "THB 14,000 per person", "Personal cameraman and edited film", "Full media coverage from a personal cameraman, with edited film."),
]
for name, price, tag, desc in pk:
    c.setStrokeColor(LINE); c.setFillColor(white); c.roundRect(40, y - 58, W - 80, 62, 8, fill=1, stroke=1)
    c.setFillColor(ORANGE if name == "VIP" else NAVY); c.setFont("DVB", 12); c.drawString(54, y - 18, name)
    c.setFillColor(INK); c.setFont("DVB", 10.5); c.drawRightString(W - 54, y - 18, price)
    c.setFont("DVB", 9.5); c.drawString(54, y - 36, tag)
    para(desc, 54, y - 50, W - 108, size=9, lead=12)
    y -= 70

# Included in all
y -= 4
c.setFillColor(INK); c.setFont("DVB", 13); c.drawString(40, y, "Included in every package"); y -= 18
for item in ["Tandem skydive experience in Pattaya, Thailand", "Safety briefing and tandem instructor support",
             "Aircraft ascent and ocean-view jump experience", "Certificate of completion"]:
    c.setFillColor(ORANGE); c.circle(46, y + 3, 2.2, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("DV", 9.5); c.drawString(56, y, item); y -= 15

# Plan
y -= 10
c.setFillColor(INK); c.setFont("DVB", 13); c.drawString(40, y, "The plan"); y -= 18
steps = [("1", "Arrival and check-in", "Sign in at the dropzone and bring your photo ID."),
         ("2", "Safety briefing and gear fitting", "Meet your instructor for the safety briefing and harness fitting."),
         ("3", "Boarding and the climb", "Board the aircraft and climb to jump altitude."),
         ("4", "Exit and freefall", "Exit with your instructor for freefall over the Gulf of Thailand."),
         ("5", "Canopy flight and landing", "Fly under the parachute with your instructor and land back at the dropzone.")]
for n, t, d in steps:
    c.setFillColor(NAVY); c.circle(50, y + 3, 8, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("DVB", 9); c.drawCentredString(50, y, n)
    c.setFillColor(INK); c.setFont("DVB", 9.5); c.drawString(66, y + 1, t)
    c.setFont("DV", 9); c.setFillColor(HexColor("#4b6372")); c.drawString(66, y - 11, d)
    y -= 25

# Location
y -= 4
c.setFillColor(INK); c.setFont("DVB", 13); c.drawString(40, y, "Where you jump"); y -= 16
y = para("Pattaya Sea View · 95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand. Operated by Dropzone Thailand. Bangkok pickup is available as a fixed-price add-on.", 40, y, W - 80, size=9.5)

# Footer
c.setFillColor(MIST); c.rect(0, 0, W, 58, fill=1, stroke=0)
c.setFillColor(HexColor("#4b6372")); c.setFont("DV", 7.8)
c.drawString(40, 38, "Source: greedyadventures.com/experiences/sea-view-skydiving (captured 2026-10-31).")
c.drawString(40, 27, "Confirm prices and availability with Greedy Adventures.")
c.drawString(40, 16, "DEMO MATERIAL: sample brochure created for the assignment, not official operator collateral.")
c.showPage(); c.save()
print("written")
