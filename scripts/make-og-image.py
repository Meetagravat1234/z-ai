"""Generate og-image.png for Hirebase — 1200x630 social share image."""
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import os

# Register fonts (so we have proper rendering)
try:
    fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
    fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
except Exception:
    pass

# Brand palette (matches the emerald + amber theme from globals.css)
EMERALD = '#10b981'   # oklch(0.55 0.15 165) ≈ emerald-500/600
AMBER = '#f59e0b'     # oklch(0.72 0.18 65) ≈ amber-500
VIOLET = '#8b5cf6'
DARK_BG = '#0f1a1f'   # dark navy sidebar color
LIGHT_TEXT = '#f8fafc'
MUTED_TEXT = '#94a3b8'

# Figure size = 1200x630 (OG standard), dpi=100 for crispness
fig, ax = plt.subplots(figsize=(12, 6.3), dpi=100)
ax.set_xlim(0, 12)
ax.set_ylim(0, 6.3)
ax.axis('off')

# Background — dark gradient look (simulate with two rectangles)
bg = FancyBboxPatch((0, 0), 12, 6.3, boxstyle="round,pad=0",
                    facecolor=DARK_BG, edgecolor='none', zorder=0)
ax.add_patch(bg)

# Decorative glow circles (top right emerald, bottom left amber)
glow1 = patches.Circle((11, 5.5), 2.5, facecolor=EMERALD, alpha=0.18, zorder=1)
ax.add_patch(glow1)
glow2 = patches.Circle((1, 0.5), 2.0, facecolor=AMBER, alpha=0.12, zorder=1)
ax.add_patch(glow2)
glow3 = patches.Circle((6, 6), 1.5, facecolor=VIOLET, alpha=0.08, zorder=1)
ax.add_patch(glow3)

# Subtle grid pattern (mimic .bg-grid from globals.css)
for x in range(0, 13):
    ax.plot([x, x], [0, 6.3], color=EMERALD, alpha=0.04, linewidth=0.5, zorder=1)
for y in range(0, 7):
    ax.plot([0, 12], [y, y], color=EMERALD, alpha=0.04, linewidth=0.5, zorder=1)

# Logo square (top-left, rounded look using FancyBboxPatch)
logo_box = FancyBboxPatch((0.6, 5.0), 0.7, 0.7,
                          boxstyle="round,pad=0.05,rounding_size=0.15",
                          facecolor=EMERALD, edgecolor='none', zorder=3)
ax.add_patch(logo_box)
ax.text(0.95, 5.35, 'H', fontsize=32, color='white', weight='bold',
        ha='center', va='center', zorder=4)

# Brand name next to logo
ax.text(1.5, 5.35, 'Hirebase', fontsize=28, color=LIGHT_TEXT, weight='bold',
        ha='left', va='center', zorder=4)
ax.text(1.5, 4.85, "India's #1 AI Job Portal", fontsize=11, color=MUTED_TEXT,
        ha='left', va='center', zorder=4, weight='medium')

# Eyebrow pill (gradient look — just emerald tint)
pill = FancyBboxPatch((0.6, 3.7), 3.8, 0.55,
                      boxstyle="round,pad=0.02,rounding_size=0.27",
                      facecolor=EMERALD, alpha=0.15,
                      edgecolor=EMERALD, linewidth=1.2, zorder=3)
ax.add_patch(pill)
ax.text(0.85, 3.97, '★  AI-powered career intelligence', fontsize=12,
        color=EMERALD, weight='bold', ha='left', va='center', zorder=4)

# Main headline
ax.text(0.6, 2.85, 'Find verified jobs.', fontsize=46, color=LIGHT_TEXT,
        weight='bold', ha='left', va='center', zorder=4)
# Second line with gradient effect (split into emerald + amber parts)
ax.text(0.6, 2.05, 'Research companies.', fontsize=46, color=EMERALD,
        weight='bold', ha='left', va='center', zorder=4)
ax.text(0.6, 1.25, 'Tailor your resume with AI.', fontsize=46, color=AMBER,
        weight='bold', ha='left', va='center', zorder=4)

# Bottom: stats row
stats_y = 0.35
ax.text(0.6, stats_y, '300+ verified jobs', fontsize=13, color=LIGHT_TEXT,
        weight='bold', ha='left', va='center', zorder=4)
ax.text(3.4, stats_y, '|', fontsize=13, color=MUTED_TEXT, ha='left', va='center', zorder=4)
ax.text(3.6, stats_y, '100+ companies', fontsize=13, color=LIGHT_TEXT,
        weight='bold', ha='left', va='center', zorder=4)
ax.text(6.4, stats_y, '|', fontsize=13, color=MUTED_TEXT, ha='left', va='center', zorder=4)
ax.text(6.6, stats_y, '6 AI tools', fontsize=13, color=LIGHT_TEXT,
        weight='bold', ha='left', va='center', zorder=4)
ax.text(8.6, stats_y, '|', fontsize=13, color=MUTED_TEXT, ha='left', va='center', zorder=4)
ax.text(8.8, stats_y, 'Free for job seekers', fontsize=13, color=LIGHT_TEXT,
        weight='bold', ha='left', va='center', zorder=4)

# Right side: URL
ax.text(11.4, 0.35, 'hirebase.in', fontsize=16, color=MUTED_TEXT,
        weight='bold', ha='right', va='center', zorder=4, family='monospace')

# Tight layout — no padding
plt.subplots_adjust(left=0, right=1, top=1, bottom=0)

out_path = '/home/z/my-project/public/og-image.png'
plt.savefig(out_path, dpi=100, facecolor=DARK_BG, bbox_inches='tight',
            pad_inches=0, transparent=False)
plt.close()

# Verify file exists and report size
size_kb = os.path.getsize(out_path) / 1024
print(f"OG image created: {out_path}")
print(f"Size: {size_kb:.1f} KB")
